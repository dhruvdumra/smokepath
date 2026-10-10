"""Alert formatting and delivery: Telegram Bot API and Amazon SES.

Production SMS would go through Amazon SNS, which in India needs a DLT-registered sender ID and templates;
that path is in the architecture but not used for the demo.
"""
import html
import json
import re
import urllib.request

from . import config, i18n

DOT = {"good": "🟢", "satisfactory": "🟢", "moderate": "🟡", "poor": "🟠", "very_poor": "🔴", "severe": "🟤"}
CAT_KEYS = [c[1] for c in i18n.CATEGORIES]
MODE = {
    "indoor": ("indoors", "अंदर"), "light": ("light activity only", "केवल हल्की गतिविधि"),
    "protect": ("masks, no waiting outside", "मास्क, बाहर इंतज़ार नहीं"), "outdoor": ("no change", "कोई बदलाव नहीं"),
}
WORK_MODE = {
    "protect": ("N95 + hourly sheltered breaks", "N95 + हर घंटे शेड में आराम"),
    "light": ("light work only", "केवल हल्का काम"), "indoor": ("rest indoors", "अंदर आराम"),
    "outdoor": ("no change", "कोई बदलाव नहीं"),
}
L = {
    "timetable": ("Timetable", "समय-सारणी"),
    "plan": ("Work plan", "काम की योजना"),
    "actions": ("Actions", "क्या करें"),
    "hourly": ("Hourly PM2.5 (school hours)", "प्रति घंटा PM2.5 (स्कूल समय)"),
    "footer": ("CAMS forecast × CPCB station correction ({conf} confidence). Guidance, not medical advice.",
               "CAMS पूर्वानुमान × CPCB स्टेशन सुधार ({conf} भरोसा)। यह मार्गदर्शन है, चिकित्सा सलाह नहीं।"),
    "replay": ("REPLAY of a real past episode", "पुराने वास्तविक प्रकरण का रीप्ले"),
    "open": ("Open in SmokePath", "SmokePath में खोलें"),
}


def level(adv):
    return CAT_KEYS.index(adv["worst"]["cat"])


def _l(key, lang):
    return L[key][0 if lang == "en" else 1]


def _slot_line(r, lang, profile="school"):
    name = r["label_en"] if lang == "en" else r["label_hi"]
    if profile == "work":
        return f"{DOT[r['cat']]} {r['start']} {name}: {WORK_MODE[r['mode']][0 if lang == 'en' else 1]}"
    if r["mode"] in ("moved", "moved_light"):
        to = f"→ {r['new_start']}–{r['new_end']}" if lang == "en" else f"→ {r['new_start']}–{r['new_end']} पर"
        return f"{DOT[r['cat']]} {r['start']} {name} {to} {DOT[r['cat_new']]}"
    return f"{DOT[r['cat']]} {r['start']} {name}: {MODE[r['mode']][0 if lang == 'en' else 1]}"


def telegram_text(adv, lang="en", site_url=None):
    esc = html.escape
    lines = []
    if adv.get("mode") == "replay":
        lines.append(f"⏪ <i>{_l('replay', lang)} ({adv['date']})</i>")
    lines.append(f"<b>{esc(adv['school']['name'])}</b>")
    lines.append(esc(adv["headline"][lang]))
    hours = adv["hourly"][7:14] if adv.get("profile", "school") == "school" else adv["hourly"][8:17]
    strip = " ".join(f"{h['hour']:02d}{DOT[CAT_KEYS[i18n.category(h['pm'])]]}" for h in hours)
    profile = adv.get("profile", "school")
    lines += ["", f"<b>{_l('hourly', lang)}</b>", strip, "",
              f"<b>{_l('plan' if profile == 'work' else 'timetable', lang)}</b>"]
    lines += [esc(_slot_line(r, lang, profile)) for r in adv["timetable"]]
    lines += ["", f"<b>{_l('actions', lang)}</b>"]
    lines += [f"• {esc(a[lang])}" for a in adv["actions"][:8]]
    lines += ["", f"<i>{esc(_l('footer', lang).format(conf=adv['correction']['confidence']))}</i>"]
    if site_url:
        lines.append(f'<a href="{esc(site_url)}?school={adv["school"]["id"]}&amp;dataset={adv["dataset"]}">{_l("open", lang)}</a>')
    return "\n".join(lines)


def telegram_call(method, payload, token=None):
    token = token or config.env("TELEGRAM_BOT_TOKEN")
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN not configured")
    req = urllib.request.Request(f"https://api.telegram.org/bot{token}/{method}",
                                 data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())


def send_telegram(chat_id, text, buttons=None):
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML", "disable_web_page_preview": True}
    if buttons:
        payload["reply_markup"] = {"inline_keyboard": buttons}
    return telegram_call("sendMessage", payload)


def email_html(adv, lang="en", site_url=None):
    body = telegram_text(adv, lang, site_url).replace("\n", "<br>")
    return (f'<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;max-width:640px">'
            f"{body}</div>")


def send_email(to, adv, lang="en", site_url=None):
    import boto3
    sender = config.env("SES_SENDER")
    subject = f"SmokePath: {adv['headline'][lang][:120]}"
    text = html.unescape(re.sub(r"<[^>]+>", "", telegram_text(adv, lang, site_url)))
    boto3.client("sesv2").send_email(
        FromEmailAddress=f"SmokePath <{sender}>", Destination={"ToAddresses": [to]},
        Content={"Simple": {"Subject": {"Data": subject, "Charset": "UTF-8"},
                            "Body": {"Html": {"Data": email_html(adv, lang, site_url), "Charset": "UTF-8"},
                                     "Text": {"Data": text, "Charset": "UTF-8"}}}})
