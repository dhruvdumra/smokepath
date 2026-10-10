"""Build bundles locally into data/out (uses ../.env for keys). Usage:
    python scripts/build_local.py live
    python scripts/build_local.py replay 2024-11-12T12:00
"""
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("SMOKEPATH_HTTP_CACHE", os.path.join(os.path.dirname(__file__), "..", "..", "data", "cache"))
from smokepath import config, pipeline, secrets, store  # noqa: E402

secrets.load()
mode = sys.argv[1] if len(sys.argv) > 1 else "live"
if mode == "replay":
    t0 = datetime.fromisoformat(sys.argv[2] if len(sys.argv) > 2 else "2024-11-12T12:00")
else:
    t0 = datetime.now(timezone.utc).replace(tzinfo=None, minute=0, second=0, microsecond=0)
b = pipeline.build(t0, mode, firms_key=config.env("FIRMS_MAP_KEY"), openaq_key=config.env("OPENAQ_API_KEY"))
key = store.dataset_key("replay" if mode == "replay" else "live")
print(key, store.put_json(key, b) // 1024, "KB", b["meta"]["counts"], b["meta"]["timings_s"], b["schools"]["at_risk"])
