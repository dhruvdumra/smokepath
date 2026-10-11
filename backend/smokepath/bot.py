"""Telegram bot: share location -> pick nearest school -> get tomorrow's timetable; scheduled alerts follow."""
from . import alerts, service, subs

TXT = {
    "welcome": (
        "SmokePath tells your school what to change tomorrow when stubble smoke or smog is coming: "
        "move PE, hold assembly indoors, shut windows in the worst hours.\n\n"
        "Share your location (button below) or type part of your school's name.",
        "SmokePath आपके स्कूल को बताता है कि पराली के धुएँ या स्मॉग वाले दिन कल क्या बदलना है: PE का समय, "
        "प्रार्थना सभा अंदर, सबसे ख़राब घंटों में खिड़कियाँ बंद।\n\nनीचे बटन से लोकेशन भेजें या स्कूल का नाम लिखें।"),
    "share": ("📍 Share location", "📍 लोकेशन भेजें"),
    "pick": ("Pick your school:", "अपना स्कूल चुनें:"),
    "pick_or_site": ("Pick your school, or mark this spot as an outdoor work site (construction, kiln, market):",
                     "अपना स्कूल चुनें, या इस जगह को बाहरी कार्यस्थल (निर्माण, भट्ठा, बाज़ार) चुनें:"),
    "site_btn": ("🏗 This spot is an outdoor work site", "🏗 यह जगह बाहरी कार्यस्थल है"),
    "site_only": ("No school within 60 km. Is this spot an outdoor work site (construction, kiln, farm, market)?",
                  "60 किमी में कोई स्कूल नहीं। क्या यह जगह बाहरी कार्यस्थल (निर्माण, भट्ठा, खेत, बाज़ार) है?"),
    "out_of_area": ("SmokePath covers Delhi NCR schools and the Punjab–Haryana–Delhi smoke belt. You're about "
                    "{km:,} km from the nearest school we cover. Type a Delhi school's name, or send /demo to see "
                    "a real smog day (11 Nov 2025).",
                    "SmokePath अभी दिल्ली NCR के स्कूलों और पंजाब–हरियाणा–दिल्ली धुएँ वाले क्षेत्र को कवर करता है। आप हमारे "
                    "सबसे नज़दीकी स्कूल से लगभग {km:,} किमी दूर हैं। दिल्ली के किसी स्कूल का नाम लिखें, या असली स्मॉग वाला "
                    "दिन (11 नवंबर 2025) देखने के लिए /demo भेजें।"),
    "none": ("No school found. Try another part of the name, or share your location.",
             "कोई स्कूल नहीं मिला। नाम का कोई और हिस्सा लिखें या लोकेशन भेजें।"),
    "subscribed": ("Subscribed to {name}. You'll get an alert the evening before a bad-air school day.",
                   "{name} के लिए सदस्यता हो गई। ख़राब हवा वाले स्कूल दिन से पहले शाम को अलर्ट मिलेगा।"),
    "nosub": ("You're not subscribed yet. Share your location or type your school's name.",
              "आपकी सदस्यता नहीं है। लोकेशन भेजें या स्कूल का नाम लिखें।"),
    "demo_hint": ("Air is calm right now. Send /demo to see what SmokePath sent on a real smoke day (11 Nov 2025).",
                  "अभी हवा ठीक है। असली धुएँ वाले दिन (11 नवंबर 2025) का संदेश देखने के लिए /demo भेजें।"),
    "stopped": ("Unsubscribed. Send /start any time.", "सदस्यता समाप्त। कभी भी /start भेजें।"),
    "lang": ("Language: English. Send /lang to switch to Hindi.", "भाषा: हिंदी। अंग्रेज़ी के लिए /lang भेजें।"),
}


NEAR_KM = 60  # beyond this the "nearest school" is not the user's school


def t(key, lang, **kw):
    return TXT[key][0 if lang == "en" else 1].format(**kw)


def _school_buttons(found):
    return [[{"text": f"{s['name'][:40]}" + (f" · {s['km']} km" if "km" in s else ""),
              "callback_data": f"sub:{s['id']}"}] for s in found]


def _send_advisories(chat, sub, dataset, site_url):
    if not sub["schools"]:
        alerts.send_telegram(chat, t("nosub", sub["lang"]))
        return
    for sid in sub["schools"][:3]:
        adv = service.school_advisory(sid, dataset)
        alerts.send_telegram(chat, alerts.telegram_text(adv, sub["lang"], site_url))
        if dataset == "live" and alerts.level(adv) < 3:
            alerts.send_telegram(chat, t("demo_hint", sub["lang"]))


def _subscribe(chat, sub, school_id, site_url):
    try:
        s, _ = service.place(school_id)
    except KeyError:
        alerts.send_telegram(chat, t("none", sub["lang"]))
        return
    if school_id not in sub["schools"]:
        sub["schools"] = ([school_id] + sub["schools"])[:3]
    subs.put(sub)
    alerts.send_telegram(chat, t("subscribed", sub["lang"], name=s["name"]))
    _send_advisories(chat, {**sub, "schools": [school_id]}, "live", site_url)


def search(q, n=6):
    q = q.strip().lower()
    if len(q) < 3:
        return []
    hits = [s for s in service.schools().values() if q in s["name"].lower()]
    return sorted(hits, key=lambda s: (not s["name"].lower().startswith(q), len(s["name"])))[:n]


def handle(update, site_url=None):
    if "callback_query" in update:
        cq = update["callback_query"]
        chat = cq["message"]["chat"]["id"]
        alerts.telegram_call("answerCallbackQuery", {"callback_query_id": cq["id"]})
        data = cq.get("data", "")
        if data.startswith("sub:"):
            _subscribe(chat, subs.subscriber("tg", chat), data[4:], site_url)
        return

    msg = update.get("message") or {}
    if not msg:
        return
    chat = msg["chat"]["id"]
    sub = subs.subscriber("tg", chat)
    lang = sub["lang"]

    if "location" in msg:
        loc = msg["location"]
        lat, lon = loc["latitude"], loc["longitude"]
        found = service.nearest_schools(lat, lon, 5)
        near = found[0]["km"] <= NEAR_KM
        inside = service.in_domain(lat, lon)
        if not near and not inside:
            alerts.send_telegram(chat, t("out_of_area", lang, km=round(found[0]["km"])))
            return
        site = [[{"text": t("site_btn", lang), "callback_data": f"sub:{service.site_id(lat, lon)}"}]] if inside else []
        if near:
            alerts.send_telegram(chat, t("pick_or_site" if inside else "pick", lang), _school_buttons(found) + site)
        else:
            alerts.send_telegram(chat, t("site_only", lang), site)
        return

    text = (msg.get("text") or "").strip()
    cmd, _, arg = text.partition(" ")
    cmd = cmd.split("@")[0].lower()
    if cmd == "/start":
        if arg.strip():
            _subscribe(chat, sub, arg.strip(), site_url)
            return
        alerts.telegram_call("sendMessage", {
            "chat_id": chat, "text": t("welcome", lang),
            "reply_markup": {"keyboard": [[{"text": t("share", lang), "request_location": True}]],
                             "resize_keyboard": True, "one_time_keyboard": True}})
    elif cmd in ("/tomorrow", "/today", "/now"):
        _send_advisories(chat, sub, "live", site_url)
    elif cmd == "/demo":
        _send_advisories(chat, sub, "replay", site_url)
    elif cmd == "/lang":
        sub["lang"] = "hi" if lang == "en" else "en"
        subs.put(sub)
        alerts.send_telegram(chat, t("lang", sub["lang"]))
    elif cmd == "/stop":
        subs.delete(sub["pk"])
        alerts.send_telegram(chat, t("stopped", lang))
    else:
        found = search(text)
        if found:
            alerts.send_telegram(chat, t("pick", lang), _school_buttons(found))
        else:
            alerts.send_telegram(chat, t("none", lang))


COMMANDS = [
    {"command": "start", "description": "Find your school"},
    {"command": "tomorrow", "description": "Advisory for your school"},
    {"command": "demo", "description": "Replay a real smoke day (11 Nov 2025)"},
    {"command": "lang", "description": "English / हिंदी"},
    {"command": "stop", "description": "Unsubscribe"},
]
