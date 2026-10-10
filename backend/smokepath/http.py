"""Stdlib-only HTTP with retries and an optional on-disk cache (local dev / replay runs)."""
import hashlib
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

USER_AGENT = "SmokePath/1.0 (+school air advisories)"
CACHE_DIR = os.environ.get("SMOKEPATH_HTTP_CACHE")  # unset on Lambda


def _cache_path(url):
    return os.path.join(CACHE_DIR, hashlib.sha256(url.encode()).hexdigest()[:32])


def get(url, params=None, headers=None, timeout=60, retries=3, cache=False):
    if params:
        url = url + ("&" if "?" in url else "?") + urllib.parse.urlencode(params, safe=",:")
    use_cache = cache and CACHE_DIR
    if use_cache and os.path.exists(_cache_path(url)):
        with open(_cache_path(url), "rb") as f:
            return f.read()
    hdrs = {"User-Agent": USER_AGENT}
    hdrs.update(headers or {})
    last = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=hdrs), timeout=timeout) as r:
                body = r.read()
            if use_cache:
                os.makedirs(CACHE_DIR, exist_ok=True)
                with open(_cache_path(url), "wb") as f:
                    f.write(body)
            return body
        except urllib.error.HTTPError as e:
            last = e
            # 4xx other than rate limiting will not fix itself on retry.
            if e.code != 429 and 400 <= e.code < 500:
                detail = e.read()[:300].decode("utf-8", "replace")
                raise RuntimeError(f"HTTP {e.code} for {url.split('?')[0]}: {detail}") from e
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            last = e
        time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"GET failed after {retries} tries: {url.split('?')[0]}: {last!r}")


def get_json(url, params=None, headers=None, timeout=60, retries=3, cache=False):
    return json.loads(get(url, params, headers, timeout, retries, cache))
