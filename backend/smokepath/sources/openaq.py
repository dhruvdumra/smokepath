"""OpenAQ ground stations (CPCB reference monitors) for bias-correcting CAMS.

Discovery and live hourly values use the v3 API (needs OPENAQ_API_KEY). Historical replay reads the
OpenAQ archive on the AWS Open Data Registry (s3://openaq-data-archive, public, no key).
"""
import csv
import gzip
import io
import threading
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

from .. import config
from ..fires import epoch_h
from ..http import get_json

PM25_PARAMETER_ID = 2


def _headers(key):
    return {"X-API-Key": key, "Accept": "application/json"}


def discover(key, bbox=config.STATION_BBOX):
    """Reference monitors measuring PM2.5 inside bbox (lat_min, lon_min, lat_max, lon_max)."""
    lat0, lon0, lat1, lon1 = bbox
    out, page = [], 1
    while True:
        data = get_json(f"{config.OPENAQ_API}/locations", {
            "bbox": f"{lon0},{lat0},{lon1},{lat1}", "parameters_id": PM25_PARAMETER_ID,
            "monitor": "true", "limit": 1000, "page": page}, headers=_headers(key))
        rows = data.get("results", [])
        for loc in rows:
            sensors = [s for s in loc.get("sensors", []) if s.get("parameter", {}).get("id") == PM25_PARAMETER_ID]
            if not sensors or loc.get("isMobile"):
                continue
            last = (loc.get("datetimeLast") or {}).get("utc")
            # Locations keep retired sensor ids; the newest id is the one still reporting.
            out.append({"id": loc["id"], "sensor": max(s["id"] for s in sensors), "name": loc.get("name"),
                        "provider": (loc.get("provider") or {}).get("name"),
                        "lat": loc["coordinates"]["latitude"], "lon": loc["coordinates"]["longitude"],
                        "first": (loc.get("datetimeFirst") or {}).get("utc"), "last": last})
        if len(rows) < 1000:
            return out
        page += 1


def _clean(series):
    """Drop impossible values and stuck sensors (same value 6+ hours running)."""
    hours = sorted(series)
    out, run = {}, 0
    for i, h in enumerate(hours):
        v = series[h]
        run = run + 1 if i and series[hours[i - 1]] == v else 1
        if 1 <= v <= 1500 and run < 6:
            out[h] = v
    return out


class _Throttle:
    """Space request starts so we stay under OpenAQ's free-tier limit (60/min)."""

    def __init__(self, per_minute=55):
        self.gap = 60.0 / per_minute
        self.lock = threading.Lock()
        self.next = 0.0

    def wait(self):
        with self.lock:
            now = time.monotonic()
            delay = max(0.0, self.next - now)
            self.next = max(now, self.next) + self.gap
        if delay:
            time.sleep(delay)


def live_hours(key, stations, start, end, workers=4):
    """{station_id: {epoch_h: pm25}} from the v3 hourly endpoint for [start, end] (naive UTC)."""
    throttle = _Throttle()

    def one(st):
        throttle.wait()
        try:
            data = get_json(f"{config.OPENAQ_API}/sensors/{st['sensor']}/hours", {
                "datetime_from": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "datetime_to": end.strftime("%Y-%m-%dT%H:%M:%SZ"), "limit": 200}, headers=_headers(key), retries=2)
        except RuntimeError:
            return st["id"], {}
        series = {}
        for r in data.get("results", []):
            v = r.get("value")
            # CPCB hours run :30-:30 UTC (whole IST hours) and are labelled by their end; the mean is centred
            # on the whole UTC hour in between, which is where CAMS's instantaneous values sit.
            to = ((r.get("period") or {}).get("datetimeTo") or {}).get("utc")
            if v is None or not to:
                continue
            series[float(round(epoch_h(to[:16]) - 0.5))] = float(v)
        return st["id"], _clean(series)

    with ThreadPoolExecutor(workers) as ex:
        return dict(ex.map(one, stations))


def _s3():
    import boto3
    from botocore import UNSIGNED
    from botocore.config import Config
    return boto3.client("s3", region_name="us-east-1", config=Config(signature_version=UNSIGNED))


def archive_hours(stations, start, end, workers=8):
    """Same shape as live_hours, read from the public OpenAQ S3 archive (one gzip CSV per location-day)."""
    s3 = _s3()
    days = []
    d = start.date()
    while d <= end.date():
        days.append(d)
        d += timedelta(days=1)
    lo, hi = epoch_h(start.strftime("%Y-%m-%dT%H:%M")), epoch_h(end.strftime("%Y-%m-%dT%H:%M"))

    def one(st):
        buckets = defaultdict(list)
        for day in days:
            key = (f"records/csv.gz/locationid={st['id']}/year={day.year}/month={day.month:02d}/"
                   f"location-{st['id']}-{day.strftime('%Y%m%d')}.csv.gz")
            try:
                body = s3.get_object(Bucket=config.OPENAQ_ARCHIVE_BUCKET, Key=key)["Body"].read()
            except Exception:
                continue
            for r in csv.DictReader(io.StringIO(gzip.decompress(body).decode("utf-8", "replace"))):
                if r.get("parameter") != "pm25":
                    continue
                try:
                    when = datetime.fromisoformat(r["datetime"]).astimezone(timezone.utc)
                    v = float(r["value"])
                except (KeyError, ValueError):
                    continue
                # 15-minute values stamped at period end; bucket them on the nearest whole UTC hour.
                h = epoch_h(when.replace(tzinfo=None).strftime("%Y-%m-%dT%H:%M")) - 0.125
                buckets[float(round(h))].append(v)
        series = {h: sum(v) / len(v) for h, v in buckets.items() if lo <= h <= hi}
        return st["id"], _clean(series)

    with ThreadPoolExecutor(workers) as ex:
        return dict(ex.map(one, stations))
