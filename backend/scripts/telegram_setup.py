"""Point the Telegram bot's webhook at the deployed API and register its commands."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from smokepath import alerts, bot, secrets  # noqa: E402

secrets.load()
site = sys.argv[1].rstrip("/")
print(alerts.telegram_call("setWebhook", {
    "url": f"{site}/api/telegram", "secret_token": os.environ["TELEGRAM_WEBHOOK_SECRET"],
    "allowed_updates": ["message", "callback_query"], "drop_pending_updates": True}))
print(alerts.telegram_call("setMyCommands", {"commands": bot.COMMANDS}))
me = alerts.telegram_call("getMe", {})["result"]
print("bot username:", me["username"])
