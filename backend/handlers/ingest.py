"""Scheduled Lambda: build the live bundle, publish it, alert subscribers. Also builds replay bundles on demand:
    {"mode": "replay", "t0": "2024-11-12T12:00", "name": "nov2024"}
"""
import json
import logging
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from smokepath import alerts, config, pipeline, secrets, service, store, subs  # noqa: E402

log = logging.getLogger()
log.setLevel(logging.INFO)

ALERT_MIN_LEVEL = 3  # alert when a school hour reaches Poor or worse


def run_alerts(dataset="live"):
    site = config.env("SITE_URL")
    sent = skipped = failed = 0
    for sub in subs.all_subscribers():
        for sid in sub.get("schools", []):
            try:
                adv = service.school_advisory(sid, dataset)
            except (KeyError, ValueError) as e:
                log.warning("skip %s: %s", sid, e)
                continue
            lvl = alerts.level(adv)
            if lvl < ALERT_MIN_LEVEL or subs.already_sent(sub["channel"], sub["to"], sid, adv["date"], lvl):
                skipped += 1
                continue
            try:
                if sub["channel"] == "tg":
                    alerts.send_telegram(int(sub["to"]), alerts.telegram_text(adv, sub.get("lang", "en"), site))
                else:
                    alerts.send_email(sub["to"], adv, sub.get("lang", "en"), site)
                subs.mark_sent(sub["channel"], sub["to"], sid, adv["date"], lvl)
                sent += 1
            except Exception as e:  # one bad recipient must not stop the rest
                log.error("send failed %s %s: %r", sub["pk"], sid, e)
                failed += 1
    return {"sent": sent, "skipped": skipped, "failed": failed}


def handler(event, context):
    secrets.load()
    event = event or {}
    mode = event.get("mode", "live")
    if mode == "replay":
        t0 = datetime.fromisoformat(event["t0"])
        key = f"data/replay/{event.get('name', 'nov2024')}.json"
    else:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        t0 = now.replace(minute=0, second=0, microsecond=0)
        key = "data/live/latest.json"
    bundle = pipeline.build(t0, mode, firms_key=config.env("FIRMS_MAP_KEY"),
                            openaq_key=config.env("OPENAQ_API_KEY"), log=log.warning)
    size = store.put_json(key, bundle, max_age=300 if mode == "live" else 3600)
    if mode == "live":
        store.put_json(f"data/live/runs/{bundle['meta']['t0']}.json", bundle["meta"], max_age=86400)
    result = {"key": key, "bytes": size, **bundle["meta"]["counts"], "timings": bundle["meta"]["timings_s"]}
    if mode == "live" and not event.get("no_alerts"):
        result["alerts"] = run_alerts("live")
    elif event.get("alert_dataset"):
        result["alerts"] = run_alerts(event["alert_dataset"])
    log.info(json.dumps(result))
    return result
