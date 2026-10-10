"""Discover reference PM2.5 monitors (CPCB etc.) in the model domain via OpenAQ v3 -> smokepath/static/stations.json."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from smokepath import secrets  # noqa: E402
from smokepath.sources import openaq  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), "..", "smokepath", "static", "stations.json")

secrets.load()
found = openaq.discover(os.environ["OPENAQ_API_KEY"])
# Keep monitors that reported during or after the Nov 2024 replay window.
keep = [s for s in found if (s.get("last") or "") >= "2024-11-01"]
with open(OUT, "w", encoding="utf-8") as f:
    json.dump({"source": "OpenAQ v3 /locations (monitor=true, PM2.5)", "stations": keep}, f, ensure_ascii=False, indent=0)
providers = {}
for s in keep:
    providers[s["provider"]] = providers.get(s["provider"], 0) + 1
print(len(found), "found,", len(keep), "kept", providers)
