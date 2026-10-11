"""Health check for the Telegram bot, end to end, without messaging any real user.

    .venv/Scripts/python.exe backend/scripts/check_bot.py

Checks: the bot token works; Telegram's webhook points at our API with no delivery errors; the webhook rejects a
forged request (wrong secret) and accepts a signed one; subscriptions exist in DynamoDB; the API Lambda logged no
bot errors in the last 24 h.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

import boto3

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from smokepath import alerts, secrets  # noqa: E402

REGION = "ap-south-1"
OK, BAD, WARN = "PASS", "FAIL", "WARN"
results = []


def check(name, status, detail=""):
    results.append(status)
    print(f"[{status}] {name}{': ' + detail if detail else ''}")


def post(url, body, secret):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": secret})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code


def main():
    secrets.load()
    site = boto3.client("cloudformation", region_name=REGION).describe_stacks(StackName="smokepath")["Stacks"][0]
    site_url = next(o["OutputValue"] for o in site["Outputs"] if o["OutputKey"] == "SiteUrl")

    # 1. Token and identity
    me = alerts.telegram_call("getMe", {})["result"]
    check("bot token", OK, f"@{me['username']} ({me['first_name']})")

    # 2. Webhook registration and delivery health
    w = alerts.telegram_call("getWebhookInfo", {})["result"]
    expected = f"{site_url}/api/telegram"
    check("webhook URL", OK if w.get("url") == expected else BAD, w.get("url") or "not set")
    pending = w.get("pending_update_count", 0)
    check("pending updates", OK if pending == 0 else WARN, str(pending))
    if w.get("last_error_date"):
        age_h = (time.time() - w["last_error_date"]) / 3600
        check("last delivery error", WARN if age_h > 24 else BAD, f"{w.get('last_error_message')} ({age_h:.1f} h ago)")
    else:
        check("last delivery error", OK, "none")
    cmds = [c["command"] for c in alerts.telegram_call("getMyCommands", {})["result"]]
    check("bot commands", OK if {"start", "tomorrow", "demo"} <= set(cmds) else WARN, ", ".join(cmds))

    # 3. Webhook auth: a forged update must be refused, a signed one accepted. The signed update is for a
    #    non-existent chat, so the bot's reply fails harmlessly inside Telegram and no real person is messaged.
    url = f"{site_url}/api/telegram"
    fake = {"update_id": 1, "message": {"message_id": 1, "chat": {"id": 1}, "text": "/start"}}
    forged = post(url, fake, "wrong-secret")
    check("forged update rejected", OK if forged == 403 else BAD, f"HTTP {forged}")
    signed = post(url, fake, os.environ["TELEGRAM_WEBHOOK_SECRET"])
    check("signed update accepted", OK if signed == 200 else BAD, f"HTTP {signed}")

    # 4. Subscriptions
    items = boto3.resource("dynamodb", region_name=REGION).Table("smokepath-subscriptions").scan().get("Items", [])
    tg = [i for i in items if i.get("channel") == "tg"]
    em = [i for i in items if i.get("channel") == "email"]
    schools = sorted({s for i in tg + em for s in i.get("schools", [])})
    check("subscribers", OK if tg or em else WARN, f"{len(tg)} Telegram, {len(em)} email, schools: {', '.join(schools) or 'none'}")

    # 5. Recent bot errors in the API Lambda logs
    logs = boto3.client("logs", region_name=REGION)
    start = int((time.time() - 86400) * 1000)
    errs = logs.filter_log_events(logGroupName="/aws/lambda/smokepath-api", startTime=start,
                                  filterPattern='"telegram update failed"').get("events", [])
    # Our own signed probe above makes exactly one expected failure (chat 1 does not exist).
    real = [e for e in errs if "chat not found" not in e["message"]]
    check("bot errors in last 24 h", OK if not real else WARN, f"{len(real)} (excluding this probe)")

    print()
    print("Result:", "ALL GOOD" if BAD not in results else "PROBLEMS FOUND")
    return 1 if BAD in results else 0


if __name__ == "__main__":
    sys.exit(main())
