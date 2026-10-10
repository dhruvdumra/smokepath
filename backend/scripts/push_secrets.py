"""Upload secrets from ../.env to SSM Parameter Store as SecureStrings (values are never printed)."""
import os
import secrets as pysecrets
import sys

import boto3

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from smokepath import secrets  # noqa: E402

ENV = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
secrets.load()
ssm = boto3.client("ssm", region_name="ap-south-1")

if not os.environ.get("TELEGRAM_WEBHOOK_SECRET"):
    # Generate once and persist so the webhook registration and the Lambda agree.
    value = pysecrets.token_urlsafe(24)
    with open(ENV, "a", encoding="utf-8") as f:
        f.write(f"\nTELEGRAM_WEBHOOK_SECRET={value}\n")
    os.environ["TELEGRAM_WEBHOOK_SECRET"] = value

for name in secrets.NAMES:
    value = os.environ.get(name)
    if not value:
        print(f"skip {name} (not set)")
        continue
    ssm.put_parameter(Name=f"/smokepath/{name.lower()}", Value=value, Type="SecureString", Overwrite=True)
    print(f"put /smokepath/{name.lower()} ({len(value)} chars)")
