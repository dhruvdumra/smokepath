"""Fire clustering and a spatial index for trajectory/fire matching."""
from collections import defaultdict
from datetime import datetime

from . import districts


def epoch_h(iso):
    """Naive-UTC ISO string -> hours since the Unix epoch."""
    return (datetime.fromisoformat(iso) - datetime(1970, 1, 1)).total_seconds() / 3600.0


def cluster(fires, cell=0.2):
    """Bin fires into ~20 km cells; FRP-weighted centroid per cell. Returns clusters sorted by FRP, largest first."""
    bins = defaultdict(list)
    for f in fires:
        bins[(int(f["lat"] // cell), int(f["lon"] // cell))].append(f)
    out = []
    for members in bins.values():
        w = [max(m["frp"], 0.1) for m in members]
        tw = sum(w)
        lat = sum(m["lat"] * wi for m, wi in zip(members, w)) / tw
        lon = sum(m["lon"] * wi for m, wi in zip(members, w)) / tw
        name, state = districts.nearest(lat, lon)
        out.append({"lat": round(lat, 4), "lon": round(lon, 4), "count": len(members),
                    "frp": round(sum(m["frp"] for m in members), 1), "district": name, "state": state,
                    "last": max(m["t"] for m in members)})
    out.sort(key=lambda c: -c["frp"])
    return out


def window(fires, t_end_h, hours=24.0):
    """Fires detected in (t_end - hours, t_end]."""
    return [f for f in fires if t_end_h - hours < f["th"] <= t_end_h]


def annotate(fires):
    for f in fires:
        f["th"] = epoch_h(f["t"])
    return fires


class FireIndex:
    """Bucket fires by 0.25 degree cell for fast 'is there a fire near this point at this time' queries."""

    CELL = 0.25

    def __init__(self, fires):
        self.cells = defaultdict(list)
        for i, f in enumerate(fires):
            self.cells[(int(f["lat"] // self.CELL), int(f["lon"] // self.CELL))].append(i)
        self.fires = fires

    def near(self, lat, lon):
        cy, cx = int(lat // self.CELL), int(lon // self.CELL)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                for i in self.cells.get((cy + dy, cx + dx), ()):
                    yield i, self.fires[i]
