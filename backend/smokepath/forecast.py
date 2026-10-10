"""Read-side view of a bundle: corrected hourly PM2.5 at any point for an IST date, plus smoke attribution."""
from datetime import date as Date, datetime, timedelta

from . import correct, trajectory
from .fires import FireIndex, annotate, epoch_h
from .geo import Grid, haversine_km

IST_OFFSET_H = 5.5


def _unflat(flat, grid):
    return [flat[i * grid.nx:(i + 1) * grid.nx] for i in range(grid.ny)]


class Forecast:
    def __init__(self, bundle):
        self.b = bundle
        m = bundle["meta"]
        g = m["grid"]
        self.grid = Grid(g["lat_min"], g["lat_min"] + g["step"] * (g["ny"] - 1),
                         g["lon_min"], g["lon_min"] + g["step"] * (g["nx"] - 1), g["step"])
        self.times = m["times"]
        self.th = [epoch_h(t) for t in self.times]
        self.pm = [_unflat(fr, self.grid) for fr in bundle["pm25"]]
        self.stations = bundle.get("stations", [])
        self.prior = correct.prior(self.stations)
        self._wind = None
        self._fires = None

    # --- time helpers -------------------------------------------------------------------------------------
    @staticmethod
    def ist_midnight_h(d):
        """Epoch hours (UTC) of 00:00 IST on date string 'YYYY-MM-DD'."""
        return epoch_h(f"{d}T00:00") - IST_OFFSET_H

    def dates(self):
        """IST dates fully inside the bundle window."""
        first = datetime(1970, 1, 1) + timedelta(hours=self.th[0] + IST_OFFSET_H)
        out = []
        d = first.date()
        for _ in range(4):
            m = self.ist_midnight_h(d.isoformat())
            if m >= self.th[0] and m + 23 <= self.th[-1]:
                out.append(d.isoformat())
            d += timedelta(days=1)
        return out

    def _series_at(self, lat, lon):
        return [self.grid.bilinear(fr, lat, lon) for fr in self.pm]

    def _interp(self, series, th):
        f = (th - self.th[0]) / (self.th[1] - self.th[0])
        i = max(0, min(int(f), len(self.th) - 2))
        a = min(max(f - i, 0.0), 1.0)
        x, y = series[i], series[i + 1]
        if x is None or y is None:
            return x if y is None else y
        return x + (y - x) * a

    # --- per-point forecast -------------------------------------------------------------------------------
    def school_hourly(self, lat, lon, d):
        """(corrected[24], raw[24], ratio, stations_within_15km) for IST date d."""
        series = self._series_at(lat, lon)
        ratio, _ = correct.ratio_at(lat, lon, self.stations, self.prior)
        near = sum(1 for s in self.stations
                   if abs(s["lat"] - lat) < 0.2 and abs(s["lon"] - lon) < 0.2
                   and haversine_km(lat, lon, s["lat"], s["lon"]) <= 15)
        m = self.ist_midnight_h(d)
        raw = [self._interp(series, m + h) or 0.0 for h in range(24)]
        return [r * ratio for r in raw], raw, ratio, near

    # --- smoke attribution --------------------------------------------------------------------------------
    def smoke(self, lat, lon, d, hour_ist):
        if self._wind is None:
            g = self.grid
            self._wind = trajectory.WindField(g, self.times, [_unflat(f, g) for f in self.b["wind_u"]],
                                              [_unflat(f, g) for f in self.b["wind_v"]])
            self._fires = FireIndex(annotate([dict(f) for f in self.b.get("fires", [])]))
        th = self.ist_midnight_h(d) + hour_ist
        out = trajectory.attribute(self._wind, self._fires, lat, lon, th)
        out["hour"] = f"{hour_ist:02d}:00"
        return out


def label_date(d, lang="en"):
    dt = Date.fromisoformat(d)
    if lang == "en":
        return dt.strftime("%a %d %b")
    days = ["सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार", "रविवार"]
    return f"{days[dt.weekday()]} {dt.day}/{dt.month}"
