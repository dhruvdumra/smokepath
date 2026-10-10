"""Kinematic trajectories on gridded GFS winds (a lightweight HYSPLIT-style advection, no dispersion physics).

Forward trajectories from fire clusters draw the animated plume; back-trajectories from schools say which
fires the arriving air passed over. Both are explanations of the CAMS forecast, not a replacement for it.
"""
import math
from statistics import median

from .districts import nearest
from .fires import FireIndex, cluster, epoch_h, window
from .geo import M_PER_DEG_LAT, haversine_km


class WindField:
    def __init__(self, grid, times_iso, u, v):
        self.grid, self.u, self.v = grid, u, v
        self.th = [epoch_h(t) for t in times_iso]
        self.dt = self.th[1] - self.th[0]

    def at(self, lat, lon, th):
        if not self.grid.contains(lat, lon) or th < self.th[0] or th > self.th[-1]:
            return None
        f = (th - self.th[0]) / self.dt
        i = min(int(f), len(self.th) - 2)
        a = f - i
        g = self.grid
        u0, u1 = g.bilinear(self.u[i], lat, lon), g.bilinear(self.u[i + 1], lat, lon)
        v0, v1 = g.bilinear(self.v[i], lat, lon), g.bilinear(self.v[i + 1], lat, lon)
        if None in (u0, u1, v0, v1):
            return None
        return (1 - a) * u0 + a * u1, (1 - a) * v0 + a * v1


def _move(lat, lon, u, v, dt_h):
    lat2 = lat + v * 3600 * dt_h / M_PER_DEG_LAT
    lon2 = lon + u * 3600 * dt_h / (M_PER_DEG_LAT * math.cos(math.radians(lat)))
    return lat2, lon2


def advect(field, lat, lon, th, hours, sign=1, dt_h=1 / 3):
    """RK2 (midpoint) integration. Returns [(th, lat, lon), ...] at every sub-step; stops at domain/time edge."""
    path = [(th, lat, lon)]
    for _ in range(int(round(hours / dt_h))):
        w1 = field.at(lat, lon, th)
        if w1 is None:
            break
        mlat, mlon = _move(lat, lon, w1[0], w1[1], sign * dt_h / 2)
        w2 = field.at(mlat, mlon, th + sign * dt_h / 2)
        if w2 is None:
            break
        lat, lon = _move(lat, lon, w2[0], w2[1], sign * dt_h)
        th += sign * dt_h
        path.append((th, lat, lon))
    return path


def _hourly(path):
    """Thin a sub-stepped path to roughly hourly points (keeps the last point)."""
    keep = path[::3]
    if keep[-1] is not path[-1]:
        keep.append(path[-1])
    return keep


def plume(field, fires, t0h, start_rel, end_rel, every=2, life=36, max_clusters=30):
    """Forward particles from the strongest fire clusters active in the 24 h before each release.

    Releases after the last satellite pass reuse the most recent day of fires (persistence, the same
    assumption CAMS makes for fire emissions in forecast mode).
    """
    last_fire = max((f["th"] for f in fires), default=None)
    out = []
    for rel in range(start_rel, end_rel, every):
        th = t0h + rel
        src = window(fires, min(th, last_fire), 24) if last_fire is not None else []
        for c in cluster(src)[:max_clusters]:
            path = _hourly(advect(field, c["lat"], c["lon"], th, life))
            if len(path) < 2:
                continue
            out.append({
                "path": [[round(p[2], 3), round(p[1], 3)] for p in path],
                "ts": [round(p[0] - t0h, 2) for p in path],
                "frp": c["frp"],
                "src": f"{c['district']}, {c['state']}",
            })
    return out


def attribute(field, index: FireIndex, lat, lon, th_arrival, back_hours=36, radius_km=25, fire_window_h=8):
    """Back-trajectory from (lat, lon) at th_arrival; collect fires the air passed within radius_km of
    while those fires were active (detection within +/- fire_window_h of the passage)."""
    path = advect(field, lat, lon, th_arrival, back_hours, sign=-1)
    matched = {}
    for th, plat, plon in path:
        for i, f in index.near(plat, plon):
            if i in matched or abs(f["th"] - th) > fire_window_h:
                continue
            if haversine_km(plat, plon, f["lat"], f["lon"]) <= radius_km:
                matched[i] = (f, th_arrival - th)
    by_district = {}
    for f, ago in matched.values():
        key = nearest(f["lat"], f["lon"])
        d = by_district.setdefault(key, {"district": key[0], "state": key[1], "frp": 0.0, "count": 0, "ago": []})
        d["frp"] += f["frp"]
        d["count"] += 1
        d["ago"].append(ago)
    sources = []
    for d in by_district.values():
        sources.append({"district": d["district"], "state": d["state"], "count": d["count"],
                        "frp": round(d["frp"], 1), "hours_before": round(median(d["ago"]))})
    sources.sort(key=lambda s: -s["frp"])
    total_frp = sum(s["frp"] for s in sources)
    count = sum(s["count"] for s in sources)
    level = "high" if (total_frp >= 500 or count >= 40) else "some" if count >= 3 else "none"
    return {"level": level, "fires": count, "frp": round(total_frp, 1), "sources": sources[:4],
            "path": [[round(p[2], 3), round(p[1], 3)] for p in _hourly(path)]}
