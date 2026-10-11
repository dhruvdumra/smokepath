"""Telegram bot + advisory service, end to end, with a fake Telegram and a synthetic forecast bundle (no network)."""
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from smokepath import alerts, bot, service, store, subs  # noqa: E402

SCHOOL = "w341481077"  # Sardar Patel Vidyalaya, New Delhi


def synthetic_bundle():
    """Uniform grid; PM2.5 high in the IST morning, lower in the afternoon. t0 = Mon 10 Nov 2025 12:00 UTC."""
    ny, nx = 15, 16
    times = []
    for d, hours in (("2025-11-09", range(12, 24)), ("2025-11-10", range(24)), ("2025-11-11", range(24)),
                     ("2025-11-12", range(13))):
        times += [f"{d}T{h:02d}:00" for h in hours]
    pm = []
    for t in times:
        ist_hour = (int(t[11:13]) + 5) % 24
        v = 320.0 if 6 <= ist_hour <= 11 else 120.0
        pm.append([v] * (ny * nx))
    return {
        "meta": {"mode": "replay", "t0": "2025-11-10T12:00", "generated": "test",
                 "grid": {"lat_min": 27.0, "lon_min": 73.6, "step": 0.4, "ny": ny, "nx": nx},
                 "times": times, "t0_index": times.index("2025-11-10T12:00"), "obs_age_h": 0},
        "pm25": pm, "ratio": [1.0] * (ny * nx), "wind_u": [[0.0] * (ny * nx)] * len(times),
        "wind_v": [[0.0] * (ny * nx)] * len(times), "stations": [], "fires": [], "clusters": [], "particles": [],
    }


@pytest.fixture
def env(monkeypatch, tmp_path):
    b = synthetic_bundle()
    monkeypatch.setattr(store, "get_json", lambda key, ttl=60: b)
    monkeypatch.setattr(subs, "LOCAL", str(tmp_path / "subs.json"))
    monkeypatch.delenv("SUBS_TABLE", raising=False)
    sent = []

    def fake_call(method, payload, token=None):
        sent.append((method, payload))
        return {"ok": True, "result": {}}

    monkeypatch.setattr(alerts, "telegram_call", fake_call)
    service._forecasts.clear()
    return sent


def texts(sent):
    return [p.get("text", "") for m, p in sent if m == "sendMessage"]


def msg(text=None, **extra):
    m = {"chat": {"id": 42}, **extra}
    if text is not None:
        m["text"] = text
    return {"message": m}


def test_school_advisory_on_bad_morning(env):
    a = service.school_advisory(SCHOOL, "replay", "2025-11-11")
    assert a["profile"] == "school" and a["date"] == "2025-11-11"
    modes = {s["kind"]: s["mode"] for s in a["timetable"]}
    assert modes["assembly"] == "indoor" and a["share_message"] and "मास्क" in a["share_message"]["hi"]
    assert "Tue" not in a["headline"]["hi"]  # Hindi headline uses the Hindi date label


def test_work_site_advisory(env):
    a = service.school_advisory(service.site_id(28.55, 77.27), "replay", "2025-11-11")
    assert a["profile"] == "work"
    keys = [x["key"] for x in a["actions"]]
    assert "work_n95" in keys and "work_window" in keys
    # The cleanest 3-hour window must be in the afternoon of this synthetic day.
    window = next(x for x in a["actions"] if x["key"] == "work_window")["en"]
    assert "12:00" in window or "13:00" in window or "14:00" in window


def test_unknown_place_is_rejected(env):
    with pytest.raises(KeyError):
        service.school_advisory("site:99.0,200.0", "replay")
    with pytest.raises(KeyError):
        service.school_advisory("nope", "replay")


def test_start_asks_for_location(env):
    bot.handle(msg("/start"))
    method, payload = env[-1]
    assert payload["reply_markup"]["keyboard"][0][0]["request_location"] is True


def test_location_offers_schools_and_work_site(env):
    bot.handle(msg(location={"latitude": 28.597, "longitude": 77.226}))
    buttons = env[-1][1]["reply_markup"]["inline_keyboard"]
    data = [row[0]["callback_data"] for row in buttons]
    assert f"sub:{SCHOOL}" in data and data[-1].startswith("sub:site:")


def test_location_outside_coverage_is_honest(env):
    bot.handle(msg(location={"latitude": 16.46, "longitude": 80.51}))  # Amaravati, ~1,360 km away
    method, payload = env[-1]
    assert "reply_markup" not in payload and "1,3" in payload["text"] and "/demo" in payload["text"]


def test_location_in_smoke_belt_far_from_schools_offers_work_site_only(env):
    bot.handle(msg(location={"latitude": 30.25, "longitude": 75.84}))  # Sangrur, Punjab
    buttons = env[-1][1]["reply_markup"]["inline_keyboard"]
    assert len(buttons) == 1 and buttons[0][0]["callback_data"].startswith("sub:site:")


def test_subscribe_by_button_then_demo_and_hindi(env):
    bot.handle({"callback_query": {"id": "q", "message": {"chat": {"id": 42}}, "data": f"sub:{SCHOOL}"}})
    assert subs.get("tg#42")["schools"] == [SCHOOL]
    assert any("Sardar Patel Vidyalaya" in t for t in texts(env))
    env.clear()
    bot.handle(msg("/demo"))
    assert any("REPLAY" in t and "Sardar Patel Vidyalaya" in t for t in texts(env))
    bot.handle(msg("/lang"))
    assert subs.get("tg#42")["lang"] == "hi"
    env.clear()
    bot.handle(msg("/demo"))
    assert any("समय-सारणी" in t for t in texts(env))


def test_work_site_subscription_message(env):
    site = service.site_id(28.55, 77.27)
    bot.handle({"callback_query": {"id": "q", "message": {"chat": {"id": 42}}, "data": f"sub:{site}"}})
    assert any("Work plan" in t and "N95" in t for t in texts(env))


def test_name_search_and_stop(env):
    bot.handle(msg("sardar patel"))
    data = [row[0]["callback_data"] for row in env[-1][1]["reply_markup"]["inline_keyboard"]]
    assert f"sub:{SCHOOL}" in data
    bot.handle({"callback_query": {"id": "q", "message": {"chat": {"id": 42}}, "data": f"sub:{SCHOOL}"}})
    bot.handle(msg("/stop"))
    assert subs.get("tg#42") is None


def test_telegram_message_fits_limit(env):
    a = service.school_advisory(SCHOOL, "replay", "2025-11-11")
    for lang in ("en", "hi"):
        assert len(alerts.telegram_text(a, lang, "https://example.org")) < 4096
