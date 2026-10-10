"""NASA FIRMS VIIRS active fires.

Live without a key: the public South Asia 48 h CSVs. With FIRMS_MAP_KEY: the area API, which also serves the
standard-processing (SP) archive used for the Nov 2025 replay. SP rows carry a `type` column; we keep type 0
(presumed vegetation fire) so refineries and power plants are not mistaken for stubble burning.
"""
import csv
import io
from datetime import datetime, timedelta

from .. import config
from ..http import get

PUBLIC_48H = [
    "/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_South_Asia_48h.csv",
    "/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_South_Asia_48h.csv",
    "/data/active_fire/noaa-21-viirs-c2/csv/J2_VIIRS_C2_South_Asia_48h.csv",
]
NRT_SOURCES = ["VIIRS_NOAA20_NRT", "VIIRS_SNPP_NRT", "VIIRS_NOAA21_NRT"]
SP_SOURCES = ["VIIRS_SNPP_SP", "VIIRS_NOAA20_SP"]


def _parse(text, bbox):
    lat0, lon0, lat1, lon1 = bbox
    out = []
    for r in csv.DictReader(io.StringIO(text)):
        try:
            lat, lon = float(r["latitude"]), float(r["longitude"])
        except (KeyError, ValueError):
            continue
        if not (lat0 <= lat <= lat1 and lon0 <= lon <= lon1):
            continue
        if (r.get("confidence") or "").lower() in ("l", "low"):
            continue
        if r.get("type") not in (None, "", "0"):
            continue
        t = r["acq_time"].zfill(4)
        when = datetime.strptime(f"{r['acq_date']} {t}", "%Y-%m-%d %H%M")
        out.append({"lat": lat, "lon": lon, "t": when.strftime("%Y-%m-%dT%H:%M"),
                    "frp": float(r.get("frp") or 0.0), "sat": r.get("satellite", "")})
    return out


def _dedupe(fires):
    seen, out = set(), []
    for f in fires:
        k = (round(f["lat"], 3), round(f["lon"], 3), f["t"])
        if k not in seen:
            seen.add(k)
            out.append(f)
    return out


def _bbox():
    g = config.GRID
    return (g["lat_min"], g["lon_min"], g["lat_max"], g["lon_max"])


def live(map_key=None):
    bbox = _bbox()
    fires = []
    if map_key:
        area = f"{bbox[1]},{bbox[0]},{bbox[3]},{bbox[2]}"
        for src in NRT_SOURCES:
            fires += _parse(get(f"{config.FIRMS_BASE}/api/area/csv/{map_key}/{src}/{area}/2").decode(), bbox)
    else:
        for path in PUBLIC_48H:
            fires += _parse(get(config.FIRMS_BASE + path, timeout=30, retries=2).decode(), bbox)
    return _dedupe(fires)


def archive(map_key, start_date, end_date):
    """SP archive fires for [start_date, end_date] (dates), fetched in <=5-day API windows."""
    bbox = _bbox()
    area = f"{bbox[1]},{bbox[0]},{bbox[3]},{bbox[2]}"
    fires = []
    day = start_date
    while day <= end_date:
        span = min(5, (end_date - day).days + 1)
        for src in SP_SOURCES:
            url = f"{config.FIRMS_BASE}/api/area/csv/{map_key}/{src}/{area}/{span}/{day.isoformat()}"
            fires += _parse(get(url, cache=True).decode(), bbox)
        day += timedelta(days=span)
    return _dedupe(fires)
