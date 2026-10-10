"""Optional Amazon Bedrock polish for the share message (parents / workers). Off unless BEDROCK_MODEL_ID is set.

The rules engine has already decided every action and number; the model may only reword. Any failure (no quota,
throttling, timeout) returns the deterministic template unchanged, so alerts never depend on the model.

Cross-account: a brand-new AWS account starts with zero Bedrock quota. If BEDROCK_ROLE_ARN is set, the Lambda
assumes that role in another account that has Claude access (see docs/bedrock-cross-account.md).
"""
import json
import logging
import re
import time

from . import config

log = logging.getLogger(__name__)

PROMPT = """Rewrite this note so it reads warmly and clearly for its readers ({audience}).
Rules: keep it under 70 words; keep every time, number, date and instruction exactly as given; do not add advice,
numbers or claims; reply in {language} only, with the note text and nothing else.

Note:
{text}"""

_client = {"c": None, "exp": 0.0}


def _bedrock():
    import boto3
    from botocore.config import Config
    cfg = Config(read_timeout=8, retries={"max_attempts": 1})
    region = config.env("BEDROCK_REGION") or None
    role = config.env("BEDROCK_ROLE_ARN")
    if not role:
        return boto3.client("bedrock-runtime", region_name=region, config=cfg)
    if _client["c"] is None or time.time() > _client["exp"]:
        creds = boto3.client("sts").assume_role(
            RoleArn=role, RoleSessionName="smokepath", ExternalId=config.env("BEDROCK_EXTERNAL_ID", "smokepath"),
            DurationSeconds=3600)["Credentials"]
        _client["c"] = boto3.client(
            "bedrock-runtime", region_name=region, config=cfg, aws_access_key_id=creds["AccessKeyId"],
            aws_secret_access_key=creds["SecretAccessKey"], aws_session_token=creds["SessionToken"])
        _client["exp"] = time.time() + 3000
    return _client["c"]


def polish(text, lang, audience="parents"):
    model = config.env("BEDROCK_MODEL_ID")
    if not model or not text:
        return text, "template"
    try:
        resp = _bedrock().converse(
            modelId=model,
            messages=[{"role": "user", "content": [{"text": PROMPT.format(
                audience=audience, language="Hindi" if lang == "hi" else "English", text=text)}]}],
            inferenceConfig={"maxTokens": 300, "temperature": 0.2})
        out = resp["output"]["message"]["content"][0]["text"].strip()
        # Guard: every number in the template must survive the rewrite.
        if not set(re.findall(r"\d+", text)) <= set(re.findall(r"\d+", out)):
            return text, "template"
        return out, "bedrock"
    except Exception as e:  # quota 0 on new accounts, throttling, timeouts, missing role
        log.warning("bedrock polish skipped: %s", json.dumps(str(e))[:200])
        return text, "template"
