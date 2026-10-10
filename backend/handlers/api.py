"""HTTP API Lambda (API Gateway HTTP API, payload v2):
    GET  /api/advisory?school=<id>&dataset=live|replay&date=YYYY-MM-DD
    POST /api/advisory          {school, dataset, date, timetable}
    GET  /api/schools/near?lat=..&lon=..
    POST /api/subscribe         {school, email, lang}
    POST /api/telegram          Telegram webhook (secret header checked)
"""
import base64
import hmac
import json
import logging
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from smokepath import bot, config, secrets, service, subs  # noqa: E402

log = logging.getLogger()
log.setLevel(logging.INFO)

EMAIL_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,190}\.[a-z]{2,24}$", re.I)
HHMM = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
KINDS = {"arrival", "assembly", "pe", "recess", "dispersal"}


def _resp(status, body):
    return {"statusCode": status, "headers": {"Content-Type": "application/json", "Cache-Control": "no-store"},
            "body": json.dumps(body, ensure_ascii=False)}


def _body(event):
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    return json.loads(raw)


def _dataset(v):
    return v if v in ("live", "replay") else "live"


def _timetable(tt):
    """Validate a user-supplied timetable; None means use the default."""
    if not tt:
        return None
    if not isinstance(tt, list) or len(tt) > 12:
        raise ValueError("timetable must be a list of up to 12 slots")
    out = []
    for i, s in enumerate(tt):
        if s.get("kind") not in KINDS or not HHMM.match(str(s.get("start"))) or not HHMM.match(str(s.get("end"))):
            raise ValueError(f"bad slot {i}")
        if s["start"] >= s["end"]:
            raise ValueError(f"slot {i} ends before it starts")
        out.append({"id": f"{s['kind']}{i}", "kind": s["kind"], "start": s["start"], "end": s["end"]})
    return out


def handler(event, context):
    secrets.load()
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path = event.get("rawPath", "")
    q = event.get("queryStringParameters") or {}
    try:
        if path.endswith("/advisory"):
            b = _body(event) if method == "POST" else q
            adv = service.school_advisory(str(b.get("school", "")), _dataset(b.get("dataset")), b.get("date") or None,
                                          _timetable(b.get("timetable")) if method == "POST" else None)
            return _resp(200, adv)

        if path.endswith("/schools/near"):
            return _resp(200, service.nearest_schools(float(q["lat"]), float(q["lon"]), 5))

        if path.endswith("/subscribe") and method == "POST":
            b = _body(event)
            email, school = str(b.get("email", "")).strip().lower(), str(b.get("school", ""))
            if not EMAIL_RE.match(email) or school not in service.schools():
                return _resp(400, {"error": "need a valid email and school"})
            sub = subs.subscriber("email", email)
            sub["lang"] = "hi" if b.get("lang") == "hi" else "en"
            sub["schools"] = ([school] + [s for s in sub["schools"] if s != school])[:3]
            subs.put(sub)
            verify = _ensure_ses_identity(email)
            return _resp(200, {"ok": True, "verification": verify})

        if path.endswith("/telegram") and method == "POST":
            expected = config.env("TELEGRAM_WEBHOOK_SECRET") or ""
            got = (event.get("headers") or {}).get("x-telegram-bot-api-secret-token", "")
            if not expected or not hmac.compare_digest(expected, got):
                return _resp(403, {"error": "forbidden"})
            try:
                bot.handle(_body(event), config.env("SITE_URL"))
            except Exception:  # Telegram retries non-200s forever; log and acknowledge
                log.exception("telegram update failed")
            return _resp(200, {"ok": True})

        return _resp(404, {"error": "not found"})
    except (KeyError, ValueError) as e:
        return _resp(400, {"error": str(e)})


def _ensure_ses_identity(email):
    """SES sandbox: recipients must be verified. Ask SES to send its verification mail once."""
    if not config.env("SUBS_TABLE"):
        return "local"
    import boto3
    ses = boto3.client("sesv2")
    try:
        st = ses.get_email_identity(EmailIdentity=email)
        return "verified" if st.get("VerifiedForSendingStatus") else "pending"
    except ses.exceptions.NotFoundException:
        ses.create_email_identity(EmailIdentity=email)
        return "sent"
