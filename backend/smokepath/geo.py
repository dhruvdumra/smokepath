"""Small geometry helpers: distances and a regular lat/lon grid with bilinear sampling."""
import math

EARTH_KM = 6371.0
M_PER_DEG_LAT = 111_320.0


def haversine_km(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_KM * math.asin(min(1.0, math.sqrt(a)))


class Grid:
    """Regular lattice; fields are stored row-major as field[iy][ix] (iy = latitude index, south to north)."""

    def __init__(self, lat_min, lat_max, lon_min, lon_max, step):
        self.step = step
        self.lat_min, self.lon_min = lat_min, lon_min
        self.ny = int(round((lat_max - lat_min) / step)) + 1
        self.nx = int(round((lon_max - lon_min) / step)) + 1
        self.lats = [round(lat_min + i * step, 4) for i in range(self.ny)]
        self.lons = [round(lon_min + j * step, 4) for j in range(self.nx)]

    @classmethod
    def from_dict(cls, d):
        return cls(d["lat_min"], d["lat_max"], d["lon_min"], d["lon_max"], d["step"])

    def to_dict(self):
        return {"lat_min": self.lat_min, "lon_min": self.lon_min, "step": self.step,
                "ny": self.ny, "nx": self.nx}

    def points(self):
        """All nodes as (iy, ix, lat, lon), row-major."""
        return [(iy, ix, lat, lon) for iy, lat in enumerate(self.lats) for ix, lon in enumerate(self.lons)]

    def contains(self, lat, lon):
        return (self.lats[0] <= lat <= self.lats[-1]) and (self.lons[0] <= lon <= self.lons[-1])

    def bilinear(self, field, lat, lon):
        """Sample field[iy][ix] at (lat, lon); clamps to the grid edge. None values are skipped."""
        fy = (lat - self.lat_min) / self.step
        fx = (lon - self.lon_min) / self.step
        fy = min(max(fy, 0.0), self.ny - 1.0)
        fx = min(max(fx, 0.0), self.nx - 1.0)
        y0, x0 = min(int(fy), self.ny - 2), min(int(fx), self.nx - 2)
        ty, tx = fy - y0, fx - x0
        acc = wsum = 0.0
        for dy, wy in ((0, 1 - ty), (1, ty)):
            for dx, wx in ((0, 1 - tx), (1, tx)):
                v = field[y0 + dy][x0 + dx]
                w = wy * wx
                if v is not None and w > 0:
                    acc += v * w
                    wsum += w
        return acc / wsum if wsum > 0 else None
