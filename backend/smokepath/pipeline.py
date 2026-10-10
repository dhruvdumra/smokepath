"""Build one forecast bundle: CAMS grid + station correction + winds + fires + plume + per-school summary.

The bundle is a single JSON document the frontend renders directly and the API samples for school advisories.
Replay runs use exactly the same code with t0 in the past and never read observations or fires after t0.
"""
import json
import os
import time
from datetime import datetime, timedelta, timezone

from . import config, correct, trajectory
from .advisor import advise
from .fires import annotate, cluster, epoch_h, window
from .forecast import Forecast
from .geo import Grid
from .sources import firms, openaq, openmeteo

STATIC = os.path.join(os.path.dirname(__file__), "static")


def load_static(name):
    with open(os.path.join(STATIC, name), encoding="utf-8") as f:
        return json.load(f)


def _flat(frames, nd=0):
    return [[None if v is None else (round(v, nd) if nd else round(v)) for row in fr for v in row] for fr in frames]


def build(t0, mode="live", *, firms_key=None, openaq_key=None, log=print):
    """t0: naive-UTC datetime on the hour. mode: 'live' or 'replay'."""
    timings = {}
    clock = time.time()
    grid = Grid.from_dict(config.GRID)
    start = t0 - timedelta(hours=config.PAST_HOURS)
    end = t0 + timedelta(hours=config.FUTURE_HOURS)
    historical = mode == "replay"
    t0h = epoch_h(t0.strftime("%Y-%m-%dT%H:%M"))

    times, pm = openmeteo.cams_pm25(grid, start, end)
    wtimes, u, v = openmeteo.gfs_wind(grid, start, end, historical=historical)
    if wtimes != times:
        raise RuntimeError(f"time axes differ: CAMS {times[0]}..{times[-1]} vs GFS {wtimes[0]}..{wtimes[-1]}")
    frame_th = [epoch_h(t) for t in times]
    timings["openmeteo"] = round(time.time() - clock, 1)

    # Fires: never after t0 (a replay must not see the future).
    clock = time.time()
    fire_src = "none"
    try:
        if historical:
            if not firms_key:
                raise RuntimeError("replay needs FIRMS_MAP_KEY for the SP archive")
            raw = firms.archive(firms_key, (start - timedelta(days=1)).date(), t0.date())
            fire_src = "FIRMS VIIRS SP archive"
        else:
            raw = firms.live(firms_key)
            fire_src = "FIRMS VIIRS NRT"
        fires = [f for f in annotate(raw) if f["th"] <= t0h]
    except RuntimeError as e:
        log(f"fires unavailable: {e}")
        fires = []
    timings["firms"] = round(time.time() - clock, 1)

    # Ground stations and bias correction.
    clock = time.time()
    stations = load_static("stations.json")["stations"] if os.path.exists(os.path.join(STATIC, "stations.json")) else []
    # Live OpenAQ can lag by days, so live runs look back 4 days and use each station's latest 24 h.
    lookback = 26 if historical else 96
    obs_from, obs_to = t0 - timedelta(hours=lookback), t0
    obs, obs_src = {}, "none"
    cams_hist, hist_th = pm, frame_th
    try:
        if stations and historical:
            obs, obs_src = openaq.archive_hours(stations, obs_from, obs_to), "OpenAQ archive (AWS Open Data)"
        elif stations and openaq_key:
            obs, obs_src = openaq.live_hours(openaq_key, stations, obs_from, obs_to), "OpenAQ v3 (CPCB)"
            htimes, cams_hist = openmeteo.cams_pm25(grid, obs_from, obs_to)
            hist_th = [epoch_h(t) for t in htimes]
    except Exception as e:  # correction is an improvement, never a single point of failure
        log(f"stations unavailable: {e!r}")
    ratios = correct.station_ratios(stations, obs, cams_hist, grid, hist_th, t0h, max_age_h=0 if historical else 72)
    obs_age = sorted(r["age_h"] for r in ratios)[len(ratios) // 2] if ratios else None
    rgrid = correct.ratio_grid(grid, ratios)
    timings["openaq"] = round(time.time() - clock, 1)

    clock = time.time()
    wind = trajectory.WindField(grid, times, u, v)
    particles = trajectory.plume(wind, fires, t0h, -config.PAST_HOURS, 24, every=2, life=36)
    timings["plume"] = round(time.time() - clock, 1)

    bundle = {
        "meta": {
            "mode": mode, "t0": t0.strftime("%Y-%m-%dT%H:%M"), "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "grid": grid.to_dict(), "times": times, "t0_index": times.index(t0.strftime("%Y-%m-%dT%H:%M")),
            "wind_level_hpa": config.WIND_LEVEL_HPA,
            "sources": {"pm25": "CAMS global via Open-Meteo", "wind": "NOAA GFS via Open-Meteo",
                        "fires": fire_src, "stations": obs_src},
            "obs_age_h": obs_age,
            "counts": {"fires_24h": len(window(fires, t0h, 24)), "stations_used": len(ratios),
                       "particles": len(particles)},
        },
        "pm25": _flat(pm),
        "ratio": [r for row in rgrid for r in row],
        "wind_u": _flat(u, 1),
        "wind_v": _flat(v, 1),
        "stations": ratios,
        "fires": [{"lat": round(f["lat"], 3), "lon": round(f["lon"], 3), "t": f["t"], "frp": round(f["frp"], 1)}
                  for f in fires if f["th"] > t0h - 48],
        "clusters": cluster(window(fires, t0h, 24))[:40],
        "particles": particles,
    }

    clock = time.time()
    bundle["schools"] = school_summary(bundle)
    timings["schools"] = round(time.time() - clock, 1)
    bundle["meta"]["timings_s"] = timings
    return bundle


def school_summary(bundle):
    """Worst school-hour PM2.5 per school for each fully covered IST date (drives map colours + counters)."""
    fc = Forecast(bundle)
    schools = load_static("schools.json")["schools"]
    out = {"dates": fc.dates(), "worst": [], "pm24": [], "at_risk": []}
    for d in out["dates"]:
        worst, pm24, risk = [], [], 0
        for s in schools:
            hourly, _, _, _ = fc.school_hourly(s["lat"], s["lon"], d)
            a = advise(hourly, s["name"], d)
            worst.append(a["worst"]["pm"])
            pm24.append(a["pm24"])
            risk += a["worst"]["pm"] > 120
        out["worst"].append(worst)
        out["pm24"].append(pm24)
        out["at_risk"].append(risk)
    return out
