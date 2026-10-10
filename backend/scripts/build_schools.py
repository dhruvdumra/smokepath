"""Pull Delhi NCR schools from OpenStreetMap (Overpass) into data/static/schools.json."""
import json
import os
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from smokepath import config  # noqa: E402

MIRRORS = ["https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter"]
OUT = os.path.join(os.path.dirname(__file__), "..", "smokepath", "static", "schools.json")


def main():
    lat0, lon0, lat1, lon1 = config.NCR_BBOX
    q = f'[out:json][timeout:120];nwr["amenity"="school"]({lat0},{lon0},{lat1},{lon1});out center tags;'
    data = None
    for url in MIRRORS:
        try:
            req = urllib.request.Request(url, data=urllib.parse.urlencode({"data": q}).encode(),
                                         headers={"User-Agent": "SmokePath/1.0"})
            data = json.load(urllib.request.urlopen(req, timeout=180))
            break
        except Exception as e:  # try the next mirror
            print("mirror failed", url, e)
    els = data["elements"]
    schools, seen = [], set()
    for e in els:
        tags = e.get("tags", {})
        name = (tags.get("name:en") or tags.get("name") or "").strip()
        lat = e.get("lat") or (e.get("center") or {}).get("lat")
        lon = e.get("lon") or (e.get("center") or {}).get("lon")
        if not name or lat is None:
            continue
        key = (name.lower(), round(lat, 3), round(lon, 3))
        if key in seen:
            continue
        seen.add(key)
        level = tags.get("isced:level") or tags.get("school:level") or ""
        schools.append({"id": f"{e['type'][0]}{e['id']}", "name": name, "name_hi": tags.get("name:hi"),
                        "lat": round(lat, 5), "lon": round(lon, 5),
                        "level": level, "operator": tags.get("operator:type") or tags.get("operator") or "",
                        "addr": ", ".join(x for x in (tags.get("addr:suburb"), tags.get("addr:city")) if x)})
    schools.sort(key=lambda s: s["name"])
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"source": "OpenStreetMap contributors (ODbL), amenity=school", "bbox": config.NCR_BBOX,
                   "schools": schools}, f, ensure_ascii=False, separators=(",", ":"))
    print(len(els), "elements ->", len(schools), "named schools")


if __name__ == "__main__":
    main()
