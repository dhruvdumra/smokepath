"""Use cases shared by the API, the Telegram bot and the scheduled alerts."""
import json
import os
from datetime import datetime, timedelta, timezone

from . import advisor, config, narrate, store
from .forecast import Forecast, label_date

_schools = None
_forecasts = {}



def schools():
    global _schools
    if _schools is None:
        with open(os.path.join(os.path.dirname(__file__), "static", "schools.json"), encoding="utf-8") as f:
            data = json.load(f)["schools"]
        _schools = {s["id"]: s for s in data}
    return _schools


def forecast(dataset="live"):
    bundle = store.get_json(store.dataset_key(dataset))
    key = (dataset, bundle["meta"]["generated"])
    if key not in _forecasts:
        _forecasts.clear()
        _forecasts[key] = Forecast(bundle)
    return _forecasts[key]


def default_date(fc, now_utc=None):
    """Today in IST until 14:00 (school still in session), tomorrow after that; clamped to the bundle."""
    dates = fc.dates()
    t0 = datetime.fromisoformat(fc.b["meta"]["t0"]).replace(tzinfo=timezone.utc)
    now = (now_utc or (t0 if fc.b["meta"]["mode"] == "replay" else datetime.now(timezone.utc))).astimezone(config.IST)
    want = now.date() if now.hour < 14 else now.date() + timedelta(days=1)
    want = want.isoformat()
    if want in dates:
        return want
    later = [d for d in dates if d >= want]
    return later[0] if later else dates[-1]


def nearest_schools(lat, lon, n=5):
    from .geo import haversine_km
    ranked = sorted(schools().values(), key=lambda s: haversine_km(lat, lon, s["lat"], s["lon"]))
    return [{**s, "km": round(haversine_km(lat, lon, s["lat"], s["lon"]), 1)} for s in ranked[:n]]


def school_advisory(school_id, dataset="live", date=None, timetable=None, with_smoke=True):
    s = schools().get(school_id)
    if not s:
        raise KeyError(f"unknown school {school_id}")
    fc = forecast(dataset)
    date = date or default_date(fc)
    if date not in fc.dates():
        raise ValueError(f"date {date} not in forecast window {fc.dates()}")
    hourly, raw, ratio, near = fc.school_hourly(s["lat"], s["lon"], date)
    smoke = None
    if with_smoke and fc.b.get("fires"):
        # Attribute the worst school hour; that is the hour the timetable is changing for.
        sh = range(7, 14)
        worst_h = max(sh, key=lambda h: hourly[h])
        smoke = fc.smoke(s["lat"], s["lon"], date, worst_h)
    adv = advisor.advise(hourly, s["name"], label_date(date), timetable, smoke=smoke)
    for k in ("headline", "parent_message"):
        if adv.get(k):
            adv[k]["hi"] = adv[k]["hi"].replace(label_date(date), label_date(date, "hi"))
    if adv.get("parent_message") and config.env("BEDROCK_MODEL_ID"):
        for lang in ("en", "hi"):
            adv["parent_message"][lang], adv["parent_message"]["by"] = narrate.polish(adv["parent_message"][lang], lang)
    meta = fc.b["meta"]
    stale = (meta.get("obs_age_h") or 0) > 24
    confidence = "high" if near >= 2 and not stale else "medium" if near or fc.stations else "low"
    return {
        "school": s, "date": date, "dataset": dataset, "dates": fc.dates(),
        "issued": meta["generated"], "t0": meta["t0"], "mode": meta["mode"],
        "hourly": [{"hour": h, "pm": round(hourly[h]), "raw": round(raw[h])} for h in range(24)],
        "correction": {"ratio": round(ratio, 2), "stations_within_15km": near,
                       "stations_used": len(fc.stations), "confidence": confidence,
                       "obs_age_h": meta.get("obs_age_h")},
        "smoke": smoke,
        **adv,
    }
