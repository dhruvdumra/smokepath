"""Rules engine: hourly corrected PM2.5 at a school + its timetable -> tomorrow's timetable and actions.

Deterministic and auditable on purpose: thresholds are CPCB PM2.5 bands applied to hourly values as guidance
bands (CPCB defines categories on 24 h means). Defaults are configurable; this is not medical advice.
"""
from . import i18n
from .i18n import category, cat_name, render

# Typical Delhi school day (IST). Schools can override per request.
DEFAULT_TIMETABLE = [
    {"id": "arrival", "kind": "arrival", "start": "07:30", "end": "08:00"},
    {"id": "assembly", "kind": "assembly", "start": "08:00", "end": "08:20"},
    {"id": "pe1", "kind": "pe", "start": "09:40", "end": "10:20"},
    {"id": "recess", "kind": "recess", "start": "10:20", "end": "10:50"},
    {"id": "pe2", "kind": "pe", "start": "12:10", "end": "12:50"},
    {"id": "dispersal", "kind": "dispersal", "start": "13:30", "end": "14:00"},
]

MODERATE, POOR, VERY_POOR = 2, 3, 4
AQI_BANDS = [(0, 30, 0, 50), (30, 60, 50, 100), (60, 90, 100, 200), (90, 120, 200, 300),
             (120, 250, 300, 400), (250, 380, 400, 500)]


def aqi_pm25(pm):
    for clo, chi, ilo, ihi in AQI_BANDS:
        if pm <= chi:
            return round(ilo + (ihi - ilo) * (pm - clo) / (chi - clo))
    return 500


def grap_stage(aqi):
    return "IV" if aqi > 450 else "III" if aqi > 400 else None


def _m(hhmm):
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def _hhmm(minutes):
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def _pm_at(hourly, minute):
    """Linear interpolation of an hourly series (index = hour of day) at a minute of the day."""
    h, frac = divmod(minute, 60)
    a = hourly[min(h, 23)]
    b = hourly[min(h + 1, 23)]
    return a + (b - a) * frac / 60.0


def _slot_pm(hourly, start, end):
    """Conservative slot exposure: the worst of start, middle and end."""
    return max(_pm_at(hourly, t) for t in (start, (start + end) // 2, end))


def _label(kind, lang):
    return i18n.SLOT_LABELS[kind][0 if lang == "en" else 1]


def _both(key, **kw):
    """Render a template in both languages; values that are themselves bilingual are passed as (en, hi)."""
    out = {}
    for lang in ("en", "hi"):
        args = {k: (v[0] if lang == "en" else v[1]) if isinstance(v, tuple) else v for k, v in kw.items()}
        out[lang] = render(key, lang, **args)
    return out


def _cat2(i):
    return (cat_name(i, "en"), cat_name(i, "hi"))


def _ranges(hours):
    """[8, 9, 10, 13] -> ['08:00–11:00', '13:00–14:00']"""
    out, run = [], []
    for h in sorted(hours):
        if run and h != run[-1] + 1:
            out.append((run[0], run[-1] + 1))
            run = []
        run.append(h)
    if run:
        out.append((run[0], run[-1] + 1))
    return [f"{a:02d}:00–{b:02d}:00" for a, b in out]


def advise(hourly, school_name, date_label, timetable=None, smoke=None):
    """hourly: 24 corrected PM2.5 values for the target date (IST hours 0-23)."""
    timetable = timetable or DEFAULT_TIMETABLE
    slots = sorted(({**s, "s": _m(s["start"]), "e": _m(s["end"])} for s in timetable), key=lambda s: s["s"])
    day_start, day_end = slots[0]["s"], slots[-1]["e"]
    school_hours = list(range(day_start // 60, (day_end + 59) // 60))
    actions = []

    # Occupied intervals a moved PE period must not collide with (every slot, including the other PE periods).
    busy = [(s["s"], s["e"]) for s in slots]
    pe_window = (min((s["e"] for s in slots if s["kind"] == "assembly"), default=day_start),
                 max((s["s"] for s in slots if s["kind"] == "dispersal"), default=day_end))

    out_slots = []
    for s in slots:
        pm = _slot_pm(hourly, s["s"], s["e"])
        c = category(pm)
        row = {"id": s["id"], "kind": s["kind"], "label_en": _label(s["kind"], "en"),
               "label_hi": _label(s["kind"], "hi"), "start": s["start"], "end": s["end"],
               "pm": round(pm), "cat": i18n.CATEGORIES[c][1], "mode": "outdoor"}
        kw = dict(start=s["start"], end=s["end"], pm=round(pm), cat=_cat2(c),
                  label=(row["label_en"], row["label_hi"]))
        if s["kind"] == "assembly":
            if c >= POOR:
                row["mode"] = "indoor"
                actions.append(("assembly_indoor", 2, _both("assembly_indoor", **kw)))
        elif s["kind"] == "recess":
            if c >= VERY_POOR:
                row["mode"] = "indoor"
                actions.append(("recess_indoor", 2, _both("recess_indoor", **kw)))
            elif c == POOR:
                row["mode"] = "light"
                actions.append(("recess_short", 3, _both("recess_short", **kw)))
        elif s["kind"] in ("arrival", "dispersal"):
            if c >= VERY_POOR:
                row["mode"] = "protect"
                actions.append(("commute", 3, _both("commute", **kw)))
        elif s["kind"] == "pe":
            if c >= POOR:
                dur = s["e"] - s["s"]
                best = None
                others = [iv for iv in busy if iv != (s["s"], s["e"])]
                for t in range(pe_window[0], pe_window[1] - dur + 1, 10):
                    if any(t < b and t + dur > a for a, b in others):
                        continue
                    p = _slot_pm(hourly, t, t + dur)
                    if best is None or p < best[1] - 0.5:
                        best = (t, p)
                if best and category(best[1]) < c and category(best[1]) <= POOR:
                    cn = category(best[1])
                    row.update(mode="moved" if cn < POOR else "moved_light", new_start=_hhmm(best[0]),
                               new_end=_hhmm(best[0] + dur), pm_new=round(best[1]), cat_new=i18n.CATEGORIES[cn][1])
                    busy.remove((s["s"], s["e"]))
                    busy.append((best[0], best[0] + dur))
                    key = "pe_move" if cn < POOR else "pe_move_light"
                    actions.append((key, 1, _both(key, new_start=row["new_start"], new_end=row["new_end"],
                                                  pm_new=round(best[1]), cat_new=_cat2(cn), **kw)))
                elif c == POOR:
                    row["mode"] = "light"
                    actions.append(("pe_light", 2, _both("pe_light", **kw)))
                else:
                    row["mode"] = "indoor"
                    cb = category(best[1]) if best else c
                    actions.append(("pe_indoor", 1, _both("pe_indoor", cat_best=_cat2(cb), **kw)))
        out_slots.append(row)

    in_school = [(h, hourly[h]) for h in school_hours]
    worst_h, worst_pm = max(in_school, key=lambda x: x[1])
    best_h, best_pm = min(in_school, key=lambda x: x[1])
    worst_c = category(worst_pm)
    bad_hours = [h for h, p in in_school if category(p) >= VERY_POOR]

    if bad_hours:
        rng_en = " and ".join(_ranges(bad_hours))
        rng_hi = " और ".join(_ranges(bad_hours)) + " के दौरान"
        actions.append(("windows_closed", 3, _both("windows_closed", ranges=(rng_en, rng_hi))))
        if category(best_pm) < VERY_POOR:
            actions.append(("ventilate", 4, _both("ventilate", hour=f"{best_h:02d}:00", pm=round(best_pm))))
    if worst_c >= POOR:
        actions.append(("sensitive", 3, _both("sensitive")))
    elif worst_c == MODERATE:
        actions.append(("sensitive_light", 4, _both("sensitive_light")))
    if worst_c >= VERY_POOR:
        actions.append(("sensitive_notify", 3, _both("sensitive_notify")))
        actions.append(("staff_n95", 4, _both("staff_n95")))

    pm24 = sum(hourly) / 24.0
    aqi24 = aqi_pm25(pm24)
    stage = grap_stage(aqi24)
    if stage:
        actions.append(("grap", 0, _both("grap", pm24=round(pm24), aqi=aqi24, cat=_cat2(category(pm24)), stage=stage)))

    if smoke and smoke.get("level") in ("high", "some") and smoke.get("sources"):
        places_en = ", ".join(f"{s['district']} ({s['state']})" for s in smoke["sources"][:3])
        places_hi = places_en
        actions.append(("smoke", 5, _both("smoke", hour=smoke["hour"], n=smoke["fires"],
                                          places=(places_en, places_hi), ago=smoke["sources"][0]["hours_before"])))

    changes = sum(1 for r in out_slots if r["mode"] != "outdoor")
    poor_hours = [h for h, p in in_school if category(p) >= POOR]
    if poor_hours:
        c_head = category(max(hourly[h] for h in poor_hours))
        headline = _both("headline_bad", date=date_label, school=school_name, cat=_cat2(c_head),
                         from_=f"{poor_hours[0]:02d}:00", to=f"{poor_hours[-1] + 1:02d}:00",
                         peak=round(worst_pm), peak_at=f"{worst_h:02d}:00", n=changes)
    else:
        headline = _both("headline_ok", date=date_label, school=school_name, cat=_cat2(worst_c))
        actions.append(("all_clear", 5, _both("all_clear", cat=_cat2(worst_c))))

    actions.sort(key=lambda a: a[1])
    parents = _parents_message(out_slots, [a[0] for a in actions], school_name, date_label, worst_pm, worst_h)         if poor_hours and changes else None
    return {
        "parent_message": parents,
        "headline": headline,
        "timetable": out_slots,
        "actions": [{"key": k, "priority": p, **txt} for k, p, txt in actions],
        "worst": {"hour": worst_h, "pm": round(worst_pm), "cat": i18n.CATEGORIES[worst_c][1]},
        "cleanest": {"hour": best_h, "pm": round(best_pm), "cat": i18n.CATEGORIES[category(best_pm)][1]},
        "pm24": round(pm24), "aqi24": aqi24, "grap_stage": stage, "changes": changes,
    }


def _join(items, lang):
    if len(items) <= 1:
        return "".join(items)
    return ", ".join(items[:-1]) + render("and", lang) + items[-1]


def _parents_message(slots, action_keys, school, date_label, peak, peak_h):
    """Short note a principal can forward to parents (WhatsApp/SMS), built only from the rules' decisions."""
    out = {}
    for lang in ("en", "hi"):
        indoor = []
        for r in slots:
            name = _label(r["kind"], lang)
            if r["mode"] == "indoor" and name not in indoor:
                indoor.append(name if not indoor or lang != "en" or name.startswith("PE") else name.lower())
        changes = render("parents_indoor", lang, names=_join(indoor, lang)) if indoor else ""
        moved = [r["new_start"] for r in slots if r["mode"] in ("moved", "moved_light")]
        if moved:
            changes += render("parents_moved", lang, time=moved[0])
        asks = []
        if "commute" in action_keys:
            asks.append(render("ask_mask", lang))
        if "sensitive" in action_keys or "sensitive_light" in action_keys:
            asks.append(render("ask_inhaler", lang))
        ask_text = render("parents_asks", lang, asks=_join(asks, lang)) if asks else ""
        out[lang] = render("parents", lang, cat=cat_name(category(peak), lang), school=school, date=date_label,
                           peak=round(peak), peak_at=f"{peak_h:02d}:00", changes=changes, asks=ask_text)
    return out
