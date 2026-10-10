"""Bundle storage: S3 on AWS (DATA_BUCKET set), a local folder otherwise. Same keys in both."""
import json
import os
import time

from . import config

LOCAL_ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "data", "out")
_cache = {}


def _bucket():
    return config.env("DATA_BUCKET")


def _s3():
    import boto3
    return boto3.client("s3")


def put_json(key, obj, max_age=300):
    body = json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if _bucket():
        _s3().put_object(Bucket=_bucket(), Key=key, Body=body, ContentType="application/json",
                         CacheControl=f"public, max-age={max_age}")
    else:
        path = os.path.join(LOCAL_ROOT, key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(body)
    _cache[key] = (time.time(), obj)
    return len(body)


def get_json(key, ttl=60):
    """Cached read; re-fetches after ttl seconds (warm Lambdas keep the bundle in memory)."""
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < ttl:
        return hit[1]
    if _bucket():
        obj = json.loads(_s3().get_object(Bucket=_bucket(), Key=key)["Body"].read())
    else:
        with open(os.path.join(LOCAL_ROOT, key), encoding="utf-8") as f:
            obj = json.load(f)
    _cache[key] = (time.time(), obj)
    return obj


REPLAY_NAME = "nov2024"


def dataset_key(dataset):
    return "data/live/latest.json" if dataset == "live" else f"data/replay/{REPLAY_NAME}.json"
