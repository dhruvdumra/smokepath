import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from smokepath import correct  # noqa: E402
from smokepath.advisor import advise, aqi_pm25, grap_stage  # noqa: E402
from smokepath.fires import FireIndex, annotate, cluster  # noqa: E402
from smokepath.geo import Grid, haversine_km  # noqa: E402
from smokepath.i18n import category  # noqa: E402
from smokepath.trajectory import WindField, advect, attribute  # noqa: E402


# --- categories / AQI / GRAP ------------------------------------------------------------------------------
def test_cpcb_breakpoints():
    assert [category(v) for v in (0, 30, 31, 60, 90, 120, 121, 250, 251)] == [0, 0, 1, 1, 2, 3, 4, 4, 5]


def test_aqi_and_grap_bands():
    assert aqi_pm25(30) == 50 and aqi_pm25(60) == 100 and aqi_pm25(250) == 400
    assert grap_stage(aqi_pm25(200)) is None          # Very Poor: Stage II, no school impact
    assert grap_stage(aqi_pm25(270)) == "III"         # AQI 401-450
    assert grap_stage(aqi_pm25(330)) == "IV"          # AQI > 450


# --- advisor ----------------------------------------------------------------------------------------------
def test_clean_day_changes_nothing():
    a = advise([40] * 24, "S", "D")
    assert a["changes"] == 0 and a["parent_message"] is None
    assert [x["key"] for x in a["actions"]] == ["all_clear"]


def test_pe_moves_to_cleaner_window_without_collisions():
    h = [70] * 24
    h[9] = h[10] = 135
    a = advise(h, "S", "D")
    pe1 = next(s for s in a["timetable"] if s["id"] == "pe1")
    assert pe1["mode"] == "moved"
    # The new slot must not overlap any other timetable slot.
    def m(t):
        return int(t[:2]) * 60 + int(t[3:])
    new = (m(pe1["new_start"]), m(pe1["new_end"]))
    for s in a["timetable"]:
        if s["id"] != "pe1":
            assert new[1] <= m(s["start"]) or new[0] >= m(s["end"]), s["id"]


def test_severe_day_moves_everything_indoors_and_flags_grap():
    a = advise([330] * 24, "S", "D")
    modes = {s["kind"]: s["mode"] for s in a["timetable"]}
    assert modes["assembly"] == "indoor" and modes["pe"] == "indoor" and modes["recess"] == "indoor"
    keys = [x["key"] for x in a["actions"]]
    assert keys[0] == "grap" and "staff_n95" in keys and a["grap_stage"] == "IV"
    assert "मास्क" in a["parent_message"]["hi"]


def test_every_action_has_both_languages():
    a = advise([300] * 8 + [100] * 16, "S", "D")
    for x in a["actions"]:
        assert x["en"] and x["hi"] and x["en"] != x["hi"]


# --- bias correction --------------------------------------------------------------------------------------
def test_ratio_idw_prefers_near_station_and_relaxes_to_prior():
    ratios = [{"id": 1, "lat": 28.6, "lon": 77.2, "ratio": 3.0},
              {"id": 2, "lat": 28.7, "lon": 77.1, "ratio": 3.0},
              {"id": 3, "lat": 30.9, "lon": 75.8, "ratio": 1.0}]
    near, n = correct.ratio_at(28.61, 77.21, ratios)
    assert 2.8 < near < 3.0 + 1e-9 and n == 2
    far, n_far = correct.ratio_at(25.0, 72.0, ratios)
    assert n_far == 0 and math.isclose(far, math.exp(correct.prior(ratios)))


def test_station_ratio_is_clipped_and_needs_enough_hours():
    g = Grid(28.0, 29.2, 76.8, 77.6, 0.4)
    frames = [[[50.0] * g.nx for _ in range(g.ny)] for _ in range(30)]
    th = [float(i) for i in range(30)]
    st = [{"id": 1, "name": "x", "lat": 28.6, "lon": 77.2}]
    obs = {1: {float(i): 1000.0 for i in range(30)}}
    r = correct.station_ratios(st, obs, frames, g, th, t_end_h=29)
    assert r[0]["ratio"] == correct.RATIO_MAX
    sparse = {1: {float(i): 100.0 for i in range(25, 30)}}
    assert correct.station_ratios(st, sparse, frames, g, th, t_end_h=29) == []


# --- trajectories -----------------------------------------------------------------------------------------
def _uniform_wind(u, v, hours=48):
    g = Grid(27.0, 32.6, 73.6, 79.6, 0.4)
    times = [f"2024-11-12T{h % 24:02d}:00" if h < 24 else f"2024-11-13T{h - 24:02d}:00" for h in range(hours)]
    uu = [[[u] * g.nx for _ in range(g.ny)] for _ in times]
    vv = [[[v] * g.nx for _ in range(g.ny)] for _ in times]
    return WindField(g, times, uu, vv)


def test_advection_distance_matches_wind_speed():
    w = _uniform_wind(5.0, 0.0)  # 5 m/s eastward = 18 km/h
    p = advect(w, 30.0, 75.0, w.th[0], 10)
    t, lat, lon = p[-1]
    assert abs(haversine_km(30.0, 75.0, lat, lon) - 180) < 3 and abs(lat - 30.0) < 1e-6


def test_back_trajectory_finds_upwind_fires():
    w = _uniform_wind(5.0, -2.0)  # north-westerly flow, like Punjab -> Delhi
    arrival = w.th[0] + 30
    path = advect(w, 28.6, 77.2, arrival, 20, sign=-1)
    _, flat, flon = path[-1]  # where the air was 20 h earlier
    fires = annotate([{"lat": flat, "lon": flon, "t": "2024-11-12T10:00", "frp": 50.0, "sat": "N"}
                      for _ in range(5)])
    fires[0]["th"] = arrival - 20
    for f in fires:
        f["th"] = arrival - 20
    a = attribute(w, FireIndex(fires), 28.6, 77.2, arrival)
    assert a["fires"] == 5 and a["level"] == "some" and 18 <= a["sources"][0]["hours_before"] <= 22


def test_cluster_labels_district():
    c = cluster([{"lat": 30.25, "lon": 75.84, "frp": 10.0, "t": "2024-11-12T08:00"}])
    assert c[0]["district"] == "Sangrur" and c[0]["state"] == "Punjab"
