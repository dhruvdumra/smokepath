"""Subscriptions and sent-alert log. DynamoDB on AWS (SUBS_TABLE), a local JSON file in dev."""
import json
import os
import time

from . import config

LOCAL = os.path.join(os.path.dirname(__file__), "..", "..", "data", "out", "subs.json")


def _table():
    import boto3
    return boto3.resource("dynamodb").Table(config.env("SUBS_TABLE"))


def _local_load():
    if os.path.exists(LOCAL):
        with open(LOCAL, encoding="utf-8") as f:
            return json.load(f)
    return {}


def _local_save(d):
    os.makedirs(os.path.dirname(LOCAL), exist_ok=True)
    with open(LOCAL, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)


def get(pk):
    if config.env("SUBS_TABLE"):
        return _table().get_item(Key={"pk": pk}).get("Item")
    return _local_load().get(pk)


def put(item):
    if config.env("SUBS_TABLE"):
        _table().put_item(Item=item)
    else:
        d = _local_load()
        d[item["pk"]] = item
        _local_save(d)


def delete(pk):
    if config.env("SUBS_TABLE"):
        _table().delete_item(Key={"pk": pk})
    else:
        d = _local_load()
        d.pop(pk, None)
        _local_save(d)


def subscriber(channel, ident):
    return get(f"{channel}#{ident}") or {"pk": f"{channel}#{ident}", "channel": channel, "to": str(ident),
                                          "schools": [], "lang": "en"}


def all_subscribers():
    if config.env("SUBS_TABLE"):
        items, kw = [], {}
        while True:
            page = _table().scan(**kw)
            items += page.get("Items", [])
            if "LastEvaluatedKey" not in page:
                break
            kw["ExclusiveStartKey"] = page["LastEvaluatedKey"]
    else:
        items = list(_local_load().values())
    return [i for i in items if i.get("channel") in ("tg", "email")]


def already_sent(channel, ident, school, date, level):
    """True if we already alerted this subscriber for this school/date at this level or worse."""
    item = get(f"sent#{channel}#{ident}#{school}#{date}")
    return bool(item) and int(item.get("level", 0)) >= level


def mark_sent(channel, ident, school, date, level):
    put({"pk": f"sent#{channel}#{ident}#{school}#{date}", "level": level, "ttl": int(time.time()) + 7 * 86400})
