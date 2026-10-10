"""Rules for outdoor work sites (construction, brick kilns, street vending, loading): the other high-exposure
group the idea names besides schools. Same inputs and output shape as advisor.advise, different timetable and
actions: shift heavy work to the cleanest window, N95s, sheltered breaks, dust control, GRAP construction bans.
"""
from . import i18n
from .advisor import MODERATE, POOR, VERY_POOR, _both, _cat2, _m, _ranges, _slot_pm, aqi_pm25, grap_stage
from .i18n import category

WORK_TIMETABLE = [
    {"id": "arrival", "kind": "arrival", "start": "07:30", "end": "08:00"},
    {"id": "heavy1", "kind": "heavy", "start": "08:00", "end": "12:00"},
    {"id": "break", "kind": "break", "start": "12:00", "end": "13:00"},
    {"id": "heavy2", "kind": "heavy", "start": "13:00", "end": "17:00"},
    {"id": "dispersal", "kind": "dispersal", "start": "17:00", "end": "17:30"},
]
LABELS = {
    "arrival": ("Workers arrive", "मज़दूरों का आगमन"),
    "heavy": ("Outdoor work", "बाहर का काम"),
    "break": ("Lunch break", "भोजन अवकाश"),
    "dispersal": ("Workers leave", "छुट्टी"),
}
HEAVY_HOURS = 3


def advise_work(hourly, site_name, date_label):
    slots = [{**s, "s": _m(s["start"]), "e": _m(s["end"])} for s in WORK_TIMETABLE]
    day = range(slots[0]["s"] // 60, (slots[-1]["e"] + 59) // 60)
    in_day = [(h, hourly[h]) for h in day]
    worst_h, worst_pm = max(in_day, key=lambda x: x[1])
    best_h, best_pm = min(in_day, key=lambda x: x[1])
    worst_c = category(worst_pm)
    bad_hours = [h for h, p in in_day if category(p) >= POOR]
    vp_hours = [h for h, p in in_day if category(p) >= VERY_POOR]
    actions = []

    # Cleanest contiguous window for the heaviest tasks, inside working hours (08:00-17:00).
    win = min(range(8, 17 - HEAVY_HOURS + 1), key=lambda h: sum(hourly[h:h + HEAVY_HOURS]))
    win_pm = sum(hourly[win:win + HEAVY_HOURS]) / HEAVY_HOURS
    win_txt = f"{win:02d}:00–{win + HEAVY_HOURS:02d}:00"

    out_slots = []
    for s in slots:
        pm = _slot_pm(hourly, s["s"], s["e"])
        c = category(pm)
        mode = "outdoor"
        if s["kind"] == "heavy":
            mode = "protect" if c >= VERY_POOR else "light" if c == POOR else "outdoor"
        elif s["kind"] == "break" and c >= POOR:
            mode = "indoor"
        elif s["kind"] in ("arrival", "dispersal") and c >= VERY_POOR:
            mode = "protect"
        en, hi = LABELS[s["kind"]]
        out_slots.append({"id": s["id"], "kind": s["kind"], "label_en": en, "label_hi": hi, "start": s["start"],
                          "end": s["end"], "pm": round(pm), "cat": i18n.CATEGORIES[c][1], "mode": mode})

    if bad_hours and category(win_pm) < worst_c:
        actions.append(("work_window", 1, _both("work_window", window=win_txt, pm=round(win_pm), cat=_cat2(category(win_pm)))))
    if worst_c >= POOR:
        actions.append(("work_n95", 1, _both("work_n95")))
        rng_en = " and ".join(_ranges(bad_hours))
        rng_hi = " और ".join(_ranges(bad_hours)) + " के दौरान"
        actions.append(("work_dust", 2, _both("work_dust", ranges=(rng_en, rng_hi))))
    if vp_hours:
        rng_en = " and ".join(_ranges(vp_hours))
        rng_hi = " और ".join(_ranges(vp_hours)) + " के दौरान"
        actions.append(("work_breaks", 2, _both("work_breaks", ranges=(rng_en, rng_hi))))
    if worst_c >= MODERATE:
        actions.append(("work_sensitive", 3, _both("work_sensitive")))

    pm24 = sum(hourly) / 24.0
    aqi24 = aqi_pm25(pm24)
    stage = grap_stage(aqi24)
    if stage:
        actions.append(("work_grap", 0, _both("work_grap", pm24=round(pm24), aqi=aqi24, cat=_cat2(category(pm24)),
                                              stage=stage)))

    changes = sum(1 for r in out_slots if r["mode"] != "outdoor")
    if bad_hours:
        headline = _both("work_headline_bad", date=date_label, site=site_name, cat=_cat2(category(worst_pm)),
                         from_=f"{bad_hours[0]:02d}:00", to=f"{bad_hours[-1] + 1:02d}:00", peak=round(worst_pm),
                         peak_at=f"{worst_h:02d}:00", window=win_txt)
        share = _both("work_share", date=date_label, cat=_cat2(category(worst_pm)),
                      from_=f"{bad_hours[0]:02d}:00", to=f"{bad_hours[-1] + 1:02d}:00", window=win_txt)
    else:
        headline = _both("work_headline_ok", date=date_label, site=site_name, cat=_cat2(worst_c))
        actions.append(("all_clear", 5, _both("work_all_clear", cat=_cat2(worst_c))))
        share = None

    actions.sort(key=lambda a: a[1])
    return {
        "profile": "work",
        "share_message": share,
        "headline": headline,
        "timetable": out_slots,
        "actions": [{"key": k, "priority": p, **txt} for k, p, txt in actions],
        "worst": {"hour": worst_h, "pm": round(worst_pm), "cat": i18n.CATEGORIES[worst_c][1]},
        "cleanest": {"hour": best_h, "pm": round(best_pm), "cat": i18n.CATEGORIES[category(best_pm)][1]},
        "pm24": round(pm24), "aqi24": aqi24, "grap_stage": stage, "changes": changes,
    }

