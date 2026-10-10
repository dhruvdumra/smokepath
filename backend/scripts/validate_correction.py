"""Does the station correction actually help? Day-ahead, leave-one-station-out test on a past episode.

For each IST day D: learn obs/CAMS ratios from the 24 h before D starts (only data a real run would have had),
then predict every station's hourly PM2.5 on D *without using that station* (so it behaves like a school
location with no monitor), and compare with what the station measured.

    python scripts/validate_correction.py 2025-10-25 2025-11-25
"""
import json
import os
import sys
from datetime import date, datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("SMOKEPATH_HTTP_CACHE", os.path.join(os.path.dirname(__file__), "..", "..", "data", "cache"))

from smokepath import config, correct  # noqa: E402
from smokepath.fires import epoch_h  # noqa: E402
from smokepath.geo import Grid  # noqa: E402
from smokepath.i18n import category  # noqa: E402
from smokepath.pipeline import load_static  # noqa: E402
from smokepath.sources import openaq, openmeteo  # noqa: E402

NCR = config.NCR_BBOX


def in_ncr(s):
    return NCR[0] <= s["lat"] <= NCR[2] and NCR[1] <= s["lon"] <= NCR[3]


def main(d0, d1):
    grid = Grid.from_dict(config.GRID)
    start = datetime.combine(d0 - timedelta(days=2), datetime.min.time())
    end = datetime.combine(d1 + timedelta(days=1), datetime.min.time())
    times, pm = openmeteo.cams_pm25(grid, start, end)
    th = [epoch_h(t) for t in times]
    stations = load_static("stations.json")["stations"]
    obs = openaq.archive_hours(stations, start, end)
    print(f"{len(stations)} stations, {sum(1 for v in obs.values() if v)} with data")

    rows = []
    d = d0
    while d <= d1:
        day_start = epoch_h(f"{d.isoformat()}T00:00") - 5.5  # 00:00 IST in UTC epoch hours
        t_end = float(int(day_start))  # last whole UTC hour before the day starts
        ratios = correct.station_ratios(stations, obs, pm, grid, th, t_end)
        prior = correct.prior(ratios)
        for s in stations:
            if not in_ncr(s):
                continue
            series = obs.get(s["id"]) or {}
            o_vals, raw_vals, cor_vals = [], [], []
            r, _ = correct.ratio_at(s["lat"], s["lon"], ratios, prior, exclude=s["id"])
            for i, t in enumerate(th):
                if day_start <= t < day_start + 24 and t in series:
                    m = grid.bilinear(pm[i], s["lat"], s["lon"])
                    if m is None:
                        continue
                    o_vals.append(series[t])
                    raw_vals.append(m)
                    cor_vals.append(m * r)
            if len(o_vals) < 18:
                continue
            mean = lambda xs: sum(xs) / len(xs)  # noqa: E731
            rows.append({"date": d.isoformat(), "station": s["name"], "obs": mean(o_vals), "raw": mean(raw_vals),
                         "cor": mean(cor_vals), "ratio": r})
        d += timedelta(days=1)

    def summary(key):
        mae = sum(abs(x[key] - x["obs"]) for x in rows) / len(rows)
        bias = sum(x[key] - x["obs"] for x in rows) / len(rows)
        hit = sum(category(x[key]) == category(x["obs"]) for x in rows) / len(rows)
        within1 = sum(abs(category(x[key]) - category(x["obs"])) <= 1 for x in rows) / len(rows)
        severe_obs = [x for x in rows if category(x["obs"]) >= 4]
        caught = sum(category(x[key]) >= 4 for x in severe_obs) / max(1, len(severe_obs))
        return {"mae": round(mae, 1), "bias": round(bias, 1), "category_hit": round(hit, 3),
                "within_one_category": round(within1, 3), "very_poor_or_worse_caught": round(caught, 3),
                "very_poor_days": len(severe_obs)}

    result = {"period": [d0.isoformat(), d1.isoformat()], "station_days": len(rows),
              "raw_cams": summary("raw"), "corrected": summary("cor")}
    by_day = {}
    for x in rows:
        by_day.setdefault(x["date"], []).append(x)
    result["daily_ncr_mean"] = [{"date": k, "obs": round(sum(x["obs"] for x in v) / len(v)),
                                 "raw": round(sum(x["raw"] for x in v) / len(v)),
                                 "cor": round(sum(x["cor"] for x in v) / len(v))} for k, v in sorted(by_day.items())]
    out = os.path.join(os.path.dirname(__file__), "..", "..", "docs", "validation.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w") as f:
        json.dump(result, f, indent=1)
    print(json.dumps({k: v for k, v in result.items() if k != "daily_ncr_mean"}, indent=1))
    for r in result["daily_ncr_mean"]:
        print(r)


if __name__ == "__main__":
    a = date.fromisoformat(sys.argv[1] if len(sys.argv) > 1 else "2025-10-25")
    b = date.fromisoformat(sys.argv[2] if len(sys.argv) > 2 else "2025-11-25")
    main(a, b)
