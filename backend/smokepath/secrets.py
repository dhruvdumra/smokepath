"""Load secrets into os.environ: SSM Parameter Store on Lambda (SSM_PREFIX set), ../.env locally."""
import os

NAMES = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET", "FIRMS_MAP_KEY", "OPENAQ_API_KEY"]
_loaded = False


def load():
    global _loaded
    if _loaded:
        return
    prefix = os.environ.get("SSM_PREFIX")
    if prefix:
        import boto3
        ssm = boto3.client("ssm")
        names = [f"{prefix}/{n.lower()}" for n in NAMES]
        resp = ssm.get_parameters(Names=names, WithDecryption=True)
        for p in resp.get("Parameters", []):
            os.environ.setdefault(p["Name"].rsplit("/", 1)[1].upper(), p["Value"])
    else:
        path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    _loaded = True
