"""Station bias correction for CAMS PM2.5.

CAMS-global badly under-predicts Indo-Gangetic smog (e.g. Delhi, 18 Nov 2024: CAMS 50-160 ug/m3 while CPCB
monitors read several hundred). Each run learns a multiplicative ratio obs/CAMS per station over the last 24 h,
then spreads it in log space by inverse-distance weighting. Where no station is close, the regional median
ratio is the prior. The ratio is held constant over the forecast (persistence of bias), a standard MOS-lite step.
"""
import math
from statistics import median

from .geo import haversine_km

RATIO_MIN, RATIO_MAX = 0.5, 6.0


def station_ratios(stations, obs, cams_frames, grid, frame_th, t_end_h, hours=24, min_hours=12, max_age_h=0):
    """Return stations that have enough paired hours, each with ratio and the paired means.

    max_age_h > 0 lets a station whose feed is delayed use its most recent `hours` of data ending up to
    max_age_h before t_end_h (live OpenAQ can lag by days); `age_h` records how stale that window is.
    """
    index = {th: t for t, th in enumerate(frame_th)}
    out = []
    for st in stations:
        series = obs.get(st["id"]) or {}
        end = t_end_h
        if max_age_h:
            recent = [h for h in series if t_end_h - max_age_h <= h <= t_end_h and h in index]
            if not recent:
                continue
            end = max(recent)
        o_vals, m_vals = [], []
        for th in sorted(series):
            if not (end - hours < th <= end) or th not in index:
                continue
            o = series[th]
            m = grid.bilinear(cams_frames[index[th]], st["lat"], st["lon"])
            if o is not None and m:
                o_vals.append(o)
                m_vals.append(m)
        if len(o_vals) < min_hours:
            continue
        ratio = min(max(median(o_vals) / max(median(m_vals), 1.0), RATIO_MIN), RATIO_MAX)
        out.append({**{k: st[k] for k in ("id", "name", "lat", "lon")}, "ratio": round(ratio, 3),
                    "hours": len(o_vals), "age_h": round(t_end_h - end),
                    "obs_mean": round(sum(o_vals) / len(o_vals), 1),
                    "cams_mean": round(sum(m_vals) / len(m_vals), 1)})
    return out


def prior(ratios):
    if len(ratios) >= 3:
        return median(math.log(r["ratio"]) for r in ratios)
    return 0.0


def ratio_at(lat, lon, ratios, prior_log=None, radius_km=60.0, prior_km=40.0, exclude=None):
    """Log-space IDW of station ratios. The prior acts like a pseudo-station at prior_km distance, so the
    correction relaxes to the regional median far from monitors. Returns (ratio, nearby_station_count)."""
    if prior_log is None:
        prior_log = prior(ratios)
    num, den, n = prior_log / prior_km ** 2, 1.0 / prior_km ** 2, 0
    for r in ratios:
        if exclude is not None and r["id"] == exclude:
            continue
        d = haversine_km(lat, lon, r["lat"], r["lon"])
        if d > radius_km:
            continue
        w = 1.0 / max(d, 2.0) ** 2
        num += w * math.log(r["ratio"])
        den += w
        n += 1
    return math.exp(num / den), n


def ratio_grid(grid, ratios):
    p = prior(ratios)
    return [[round(ratio_at(lat, lon, ratios, p)[0], 3) for lon in grid.lons] for lat in grid.lats]
