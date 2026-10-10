"""Open-Meteo: CAMS PM2.5 (air-quality API) and GFS winds, sampled on a Grid.

All times are naive-UTC ISO hours ("2024-11-15T06:00"); callers convert to IST for display.
"""
import math

from .. import config
from ..http import get_json

FMT = "%Y-%m-%dT%H:%M"


def _fetch_grid(url, grid, variables, start, end, extra=None, chunk=120):
    """Return (times, {var: frames}) with frames[t][iy][ix] for every node of grid."""
    pts = grid.points()
    frames = None
    times = None
    for i in range(0, len(pts), chunk):
        part = pts[i:i + chunk]
        params = {
            "latitude": ",".join(f"{p[2]:.2f}" for p in part),
            "longitude": ",".join(f"{p[3]:.2f}" for p in part),
            "hourly": ",".join(variables),
            "start_hour": start.strftime(FMT),
            "end_hour": end.strftime(FMT),
            "timezone": "GMT",
        }
        params.update(extra or {})
        data = get_json(url, params, timeout=90, cache=True)
        if isinstance(data, dict):
            data = [data]
        if times is None:
            times = data[0]["hourly"]["time"]
            frames = {v: [[[None] * grid.nx for _ in range(grid.ny)] for _ in times] for v in variables}
        for (iy, ix, _, _), loc in zip(part, data):
            hourly = loc["hourly"]
            for v in variables:
                series = hourly.get(v) or []
                for t in range(min(len(times), len(series))):
                    frames[v][t][iy][ix] = series[t]
    return times, frames


def cams_pm25(grid, start, end):
    times, f = _fetch_grid(config.OPENMETEO_AQ, grid, ["pm2_5"], start, end, {"domains": "cams_global"})
    return times, f["pm2_5"]


def gfs_wind(grid, start, end, historical=False, level=config.WIND_LEVEL_HPA):
    """Winds at a pressure level as (times, u, v) in m/s; u eastward, v northward."""
    sp, dr = f"wind_speed_{level}hPa", f"wind_direction_{level}hPa"
    url = config.OPENMETEO_GFS_HISTORICAL if historical else config.OPENMETEO_GFS
    extra = {"wind_speed_unit": "ms"}
    if historical:
        extra["models"] = "gfs_seamless"
    times, f = _fetch_grid(url, grid, [sp, dr], start, end, extra)
    u = [[[None] * grid.nx for _ in range(grid.ny)] for _ in times]
    v = [[[None] * grid.nx for _ in range(grid.ny)] for _ in times]
    for t in range(len(times)):
        for iy in range(grid.ny):
            for ix in range(grid.nx):
                s, d = f[sp][t][iy][ix], f[dr][t][iy][ix]
                if s is None or d is None:
                    continue
                # Meteorological direction is where the wind blows FROM.
                rad = math.radians(d)
                u[t][iy][ix] = -s * math.sin(rad)
                v[t][iy][ix] = -s * math.cos(rad)
    return times, u, v
