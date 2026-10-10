"""Optional Amazon Bedrock polish for the parent message. Off unless BEDROCK_MODEL_ID is set.

The rules engine has already decided every action and number; the model may only reword. Any failure (no quota,
throttling, timeout) returns the deterministic template unchanged, so alerts never depend on the model.
"""
import json
import logging
import re

from . import config

log = logging.getLogger(__name__)

PROMPT = """Rewrite this note from a school principal to parents so it reads warmly and clearly.
Rules: keep it under 70 words; keep every time, number, date and instruction exactly as given; do not add advice,
numbers or claims; reply in {language} only, with the note text and nothing else.

Note:
{text}"""


def polish(text, lang):
    model = config.env("BEDROCK_MODEL_ID")
    if not model or not text:
        return text, "template"
    try:
        import boto3
        from botocore.config import Config
        client = boto3.client("bedrock-runtime", config=Config(read_timeout=8, retries={"max_attempts": 1}))
        resp = client.converse(
            modelId=model,
            messages=[{"role": "user", "content": [{"text": PROMPT.format(
                language="Hindi" if lang == "hi" else "English", text=text)}]}],
            inferenceConfig={"maxTokens": 300, "temperature": 0.2})
        out = resp["output"]["message"]["content"][0]["text"].strip()
        # Guard: every number in the template must survive the rewrite.
        if not set(re.findall(r"\d+", text)) <= set(re.findall(r"\d+", out)):
            return text, "template"
        return out, "bedrock"
    except Exception as e:  # quota 0 on new accounts, throttling, timeouts
        log.warning("bedrock polish skipped: %s", json.dumps(str(e))[:200])
        return text, "template"
