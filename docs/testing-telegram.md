# Testing the Telegram bot

## 1. Automatic health check (2 seconds, messages nobody)

```bash
.venv/Scripts/python.exe backend/scripts/check_bot.py
```

It checks every link in the chain and prints PASS / WARN / FAIL for each:

| Check | What it proves |
|---|---|
| bot token | The token in SSM/.env is valid; prints the bot's username and display name |
| webhook URL | Telegram is delivering updates to `https://<site>/api/telegram` |
| pending updates | Telegram has no backlog it failed to deliver |
| last delivery error | Telegram reached our API without errors recently |
| bot commands | `/start`, `/tomorrow`, `/demo`, `/lang`, `/stop` are registered |
| forged update rejected | A request without the secret header gets HTTP 403 |
| signed update accepted | A correctly signed update is processed (HTTP 200). It targets a non-existent chat, so no real person is messaged |
| subscribers | Telegram and email subscriptions stored in DynamoDB |
| bot errors in last 24 h | The API Lambda logged no failures handling real updates |

All PASS means the bot works end to end.

## 2. Manual test on your phone (2 minutes)

1. Open https://t.me/coolgrid_bot, or scan the QR code on the home page.
2. Send `/start`. **Expect:** the welcome text and a "Share location" button.
3. Type `sardar`. **Expect:** a list of matching schools as buttons. Tap **Sardar Patel Vidyalaya**.
   - **Expect:** "Subscribed to Sardar Patel Vidyalaya…", then the current ticket.
   - In calm October air you also get a hint to try `/demo`.
4. Send `/demo`. **Expect:** the 11 Nov 2025 replay ticket for Sardar Patel Vidyalaya: Severe 07:00–14:00, the timetable and the actions.
5. Send `/lang`, then `/demo` again. **Expect:** the same ticket in Hindi.
6. Share a location far outside Delhi NCR. **Expect:** "you're about N km from the nearest school we cover" and no school list.
7. Send `/stop`. **Expect:** "Unsubscribed." Run the health check again; the subscriber count drops by one.

## 3. Test the evening alert itself

Real alerts go out from the scheduled ingest every 3 hours, and only when a subscribed school has Poor-or-worse air
during tomorrow's school hours. October air is usually calm, so to see an alert on demand, run the replay ingest with
alerts. This messages every current subscriber with the 11 Nov 2025 replay (once per school; repeats are
de-duplicated):

```bash
aws lambda invoke --function-name smokepath-ingest --region ap-south-1 \
  --payload '{"mode":"replay","t0":"2025-11-10T12:00","name":"nov2025","alert_dataset":"replay"}' \
  --cli-binary-format raw-in-base64-out out.json && cat out.json
```

**Expect:** `"alerts": {"sent": N, ...}` in `out.json`, and the alert arriving in Telegram within seconds.
