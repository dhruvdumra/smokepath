"""English + Hindi advisory templates. Rules pick the template and the numbers; text never invents either."""

CATEGORIES = [
    # (upper bound ug/m3 inclusive, key, English, Hindi) — CPCB PM2.5 breakpoints
    (30, "good", "Good", "अच्छा"),
    (60, "satisfactory", "Satisfactory", "संतोषजनक"),
    (90, "moderate", "Moderate", "मध्यम"),
    (120, "poor", "Poor", "ख़राब"),
    (250, "very_poor", "Very Poor", "बहुत ख़राब"),
    (float("inf"), "severe", "Severe", "गंभीर"),
]

SLOT_LABELS = {
    "arrival": ("Arrival", "आगमन"),
    "assembly": ("Morning assembly", "प्रार्थना सभा"),
    "pe": ("PE / games", "खेल-कूद (PE)"),
    "recess": ("Recess", "मध्यावकाश"),
    "dispersal": ("Dispersal", "छुट्टी"),
}

T = {
    "assembly_indoor": (
        "Hold morning assembly indoors ({start}–{end}): forecast {pm} µg/m³ ({cat}).",
        "सुबह की प्रार्थना सभा ({start}–{end}) अंदर करें: अनुमानित PM2.5 {pm} µg/m³ ({cat})।"),
    "assembly_ok": (
        "Assembly can stay outdoors ({start}–{end}, {cat}).",
        "प्रार्थना सभा बाहर हो सकती है ({start}–{end}, {cat})।"),
    "pe_move": (
        "Move {label} from {start}–{end} to {new_start}–{new_end}: {pm} → {pm_new} µg/m³ ({cat} → {cat_new}).",
        "{label} को {start}–{end} से हटाकर {new_start}–{new_end} पर करें: {pm} → {pm_new} µg/m³ ({cat} → {cat_new})।"),
    "pe_move_light": (
        "Move {label} from {start}–{end} to {new_start}–{new_end} ({pm} → {pm_new} µg/m³, {cat} → {cat_new}); "
        "light activity only, no running.",
        "{label} को {start}–{end} से {new_start}–{new_end} पर करें ({pm} → {pm_new} µg/m³, {cat} → {cat_new}); "
        "केवल हल्की गतिविधि, दौड़ नहीं।"),
    "pe_indoor": (
        "{label} at {start}–{end}: indoors only (yoga, stretching, indoor games). No school hour is better than {cat_best}.",
        "{start}–{end} का {label}: केवल अंदर (योग, स्ट्रेचिंग, इनडोर खेल)। स्कूल के किसी भी घंटे में हवा {cat_best} से बेहतर नहीं।"),
    "pe_light": (
        "{label} at {start}–{end}: light activity only, no running; students with asthma stay indoors ({cat}).",
        "{start}–{end} का {label}: केवल हल्की गतिविधि, दौड़ नहीं; अस्थमा वाले छात्र अंदर रहें ({cat})।"),
    "pe_ok": (
        "{label} at {start}–{end} can stay outdoors ({cat}).",
        "{start}–{end} का {label} बाहर हो सकता है ({cat})।"),
    "recess_indoor": (
        "Recess {start}–{end} indoors ({pm} µg/m³, {cat}).",
        "मध्यावकाश {start}–{end} अंदर रखें ({pm} µg/m³, {cat})।"),
    "recess_short": (
        "Recess {start}–{end}: outdoors 15 min max, no running games ({cat}).",
        "मध्यावकाश {start}–{end}: बाहर अधिकतम 15 मिनट, दौड़ने वाले खेल नहीं ({cat})।"),
    "commute": (
        "{label} {start}–{end} is {cat} ({pm} µg/m³): open gates early so children go straight in; ask parents to send masks.",
        "{label} {start}–{end} के समय हवा {cat} ({pm} µg/m³): गेट जल्दी खोलें ताकि बच्चे सीधे अंदर जाएँ; अभिभावकों से मास्क भेजने को कहें।"),
    "windows_closed": (
        "Keep windows and doors shut {ranges}; run air purifiers if you have them.",
        "{ranges} खिड़कियाँ-दरवाज़े बंद रखें; एयर प्यूरीफ़ायर हों तो चलाएँ।"),
    "ventilate": (
        "Air out classrooms for 10–15 min around {hour} (cleanest school hour, {pm} µg/m³).",
        "लगभग {hour} बजे (स्कूल का सबसे साफ़ घंटा, {pm} µg/m³) कक्षाओं को 10–15 मिनट हवा दें।"),
    "sensitive": (
        "Students with asthma or heart conditions: indoor activities all day; check they carry inhalers.",
        "अस्थमा या हृदय रोग वाले छात्र: पूरे दिन अंदर की गतिविधियाँ; देखें कि इनहेलर साथ हो।"),
    "sensitive_light": (
        "Students with asthma or heart conditions: skip strenuous outdoor activity; check they carry inhalers.",
        "अस्थमा या हृदय रोग वाले छात्र: बाहर ज़ोरदार गतिविधि न करें; देखें कि इनहेलर साथ हो।"),
    "sensitive_notify": (
        "Message parents of sensitive students tonight.",
        "संवेदनशील छात्रों के अभिभावकों को आज रात संदेश भेजें।"),
    "staff_n95": (
        "Gate, bus and security staff on outdoor duty: N95 masks.",
        "गेट, बस और सुरक्षा कर्मचारी बाहर ड्यूटी पर N95 मास्क पहनें।"),
    "grap": (
        "Daily mean forecast {pm24} µg/m³ (≈AQI {aqi}, {cat}): the range where GRAP Stage {stage} applies, which can "
        "move classes to hybrid mode. Keep an online plan ready and follow official orders.",
        "दैनिक औसत अनुमान {pm24} µg/m³ (≈AQI {aqi}, {cat}): इस स्तर पर GRAP चरण {stage} लागू होता है, जिसमें कक्षाएँ "
        "हाइब्रिड मोड में जा सकती हैं। ऑनलाइन योजना तैयार रखें और आधिकारिक आदेशों का पालन करें।"),
    "all_clear": (
        "No changes needed: air stays {cat} or better through the school day.",
        "कोई बदलाव ज़रूरी नहीं: स्कूल समय में हवा {cat} या बेहतर रहेगी।"),
    "smoke": (
        "Smoke signal: air arriving around {hour} passed over {n} fire detections near {places} about {ago} h earlier.",
        "धुएँ का संकेत: लगभग {hour} बजे पहुँचने वाली हवा करीब {ago} घंटे पहले {places} के पास {n} आग वाली जगहों के ऊपर से गुज़री।"),
    "parents": (
        "Dear parents, {cat} air is forecast near {school} on {date} (peak {peak} µg/m³ around {peak_at}). {changes}{asks}Thank you.",
        "प्रिय अभिभावक, {date} को {school} के आसपास हवा {cat} रहने का अनुमान है (सबसे ज़्यादा {peak} µg/m³, लगभग {peak_at} बजे)। {changes}{asks}धन्यवाद।"),
    "parents_indoor": ("{names} will be held indoors. ", "{names} अंदर होंगे। "),
    "parents_moved": ("PE moves to {time}. ", "PE का समय {time} होगा। "),
    "parents_asks": ("Please {asks}. ", "कृपया {asks}। "),
    "ask_mask": ("send your child with a mask for the commute", "बच्चे को आने-जाने के लिए मास्क दें"),
    "ask_inhaler": ("make sure children with asthma carry their inhaler", "अस्थमा वाले बच्चों का इनहेलर साथ भेजें"),
    "and": (" and ", " और "),
    "work_window": (
        "Schedule the heaviest tasks (digging, loading, cutting, mixing) for {window}: cleanest stretch of the day ({pm} µg/m³, {cat}).",
        "सबसे भारी काम (खुदाई, ढुलाई, कटाई, मसाला) {window} में करवाएँ: दिन का सबसे साफ़ समय ({pm} µg/m³, {cat})।"),
    "work_n95": (
        "Give every outdoor worker an N95 mask (not cloth or surgical), check the fit, replace it daily.",
        "हर बाहर काम करने वाले को N95 मास्क दें (कपड़े या सर्जिकल नहीं), सही फ़िट जाँचें, रोज़ नया दें।"),
    "work_dust": (
        "Wet the site and cover sand and debris; stop cutting, grinding and other dust-raising work during {ranges}.",
        "साइट पर पानी छिड़कें, रेत-मलबा ढकें; {ranges} कटाई, घिसाई और धूल उड़ाने वाला काम रोकें।"),
    "work_breaks": (
        "Add a 10-minute break every hour during {ranges}, in a closed room or shelter; give water.",
        "{ranges} हर घंटे 10 मिनट बंद कमरे या शेड में आराम दें; पानी दें।"),
    "work_sensitive": (
        "Workers with asthma, TB history or heart problems: indoor or light tasks only.",
        "अस्थमा, टीबी के इतिहास या हृदय रोग वाले मज़दूर: केवल अंदर या हल्का काम।"),
    "work_grap": (
        "Daily mean forecast {pm24} µg/m³ (≈AQI {aqi}, {cat}): the GRAP Stage {stage} range, where non-essential "
        "construction and demolition in Delhi NCR are banned. Check CAQM orders before starting work.",
        "दैनिक औसत अनुमान {pm24} µg/m³ (≈AQI {aqi}, {cat}): GRAP चरण {stage} का स्तर, जिसमें दिल्ली NCR में ग़ैर-ज़रूरी "
        "निर्माण और तोड़फोड़ पर रोक लगती है। काम शुरू करने से पहले CAQM के आदेश देखें।"),
    "work_headline_bad": (
        "{date}: {cat} air at {site} from {from_} to {to} (peak {peak} µg/m³ at {peak_at}). Do heavy work {window}.",
        "{date}: {site} पर {from_} से {to} तक हवा {cat} (सबसे ज़्यादा {peak} µg/m³, {peak_at} बजे)। भारी काम {window} में करें।"),
    "work_all_clear": (
        "No changes needed: air stays {cat} or better through the working day.",
        "कोई बदलाव ज़रूरी नहीं: काम के पूरे समय हवा {cat} या बेहतर रहेगी।"),
    "work_headline_ok": (
        "{date}: air at {site} stays {cat} or better during working hours. No changes needed.",
        "{date}: {site} पर काम के समय हवा {cat} या बेहतर रहेगी। कोई बदलाव ज़रूरी नहीं।"),
    "work_share": (
        "Tomorrow ({date}) the air will be {cat} from {from_} to {to}. Wear the N95 mask all day, rest 10 minutes "
        "every hour in the shelter, and the heavy work will be done {window}.",
        "कल ({date}) {from_} से {to} तक हवा {cat} रहेगी। पूरे दिन N95 मास्क पहनें, हर घंटे 10 मिनट शेड में आराम करें, "
        "भारी काम {window} में होगा।"),
    "headline_bad": (
        "{date}: {cat} air at {school} from {from_} to {to} (peak {peak} µg/m³ at {peak_at}). {n} timetable changes.",
        "{date}: {school} में {from_} से {to} तक हवा {cat} (सबसे ज़्यादा {peak} µg/m³, {peak_at} बजे)। समय-सारणी में {n} बदलाव।"),
    "headline_ok": (
        "{date}: air at {school} stays {cat} or better during school hours. No changes needed.",
        "{date}: {school} में स्कूल समय के दौरान हवा {cat} या बेहतर रहेगी। कोई बदलाव ज़रूरी नहीं।"),
}


def category(pm):
    for i, (hi, key, en, hi_name) in enumerate(CATEGORIES):
        if pm <= hi:
            return i
    return len(CATEGORIES) - 1


def cat_name(i, lang):
    return CATEGORIES[i][2] if lang == "en" else CATEGORIES[i][3]


def render(key, lang, **kw):
    return T[key][0 if lang == "en" else 1].format(**kw)
