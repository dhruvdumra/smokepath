#!/usr/bin/env bash
# One-command deploy: secrets -> SAM stack -> frontend -> CloudFront invalidation -> Telegram webhook.
set -euo pipefail
cd "$(dirname "$0")"
REGION=ap-south-1
STACK=smokepath
SAM="${SAM:-$HOME/.local/bin/sam}"
export SAM_CLI_TELEMETRY=0
PY="${PY:-.venv/Scripts/python.exe}"

[ -f .env ] && "$PY" backend/scripts/push_secrets.py
find backend -name __pycache__ -type d -prune -exec rm -rf {} +

envval() { [ -f .env ] && tr -d '\r' < .env | sed -n "s/^$1=//p" | tail -1 || true; }
out() { aws cloudformation describe-stacks --stack-name $STACK --region $REGION --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text 2>/dev/null || true; }
SITE=$(out SiteUrl)
PARAMS=(SesSender=dhruvdumra@gmail.com)
[ -n "$SITE" ] && PARAMS+=(SiteUrl="$SITE")
# Optional cross-account Bedrock (docs/bedrock-cross-account.md); SAM rejects empty values, so pass only set ones.
for kv in BedrockModelId:BEDROCK_MODEL_ID BedrockRoleArn:BEDROCK_ROLE_ARN BedrockRegion:BEDROCK_REGION; do
  v="$(envval "${kv#*:}")"
  if [ -n "$v" ]; then PARAMS+=("${kv%%:*}=$v"); fi
done
"$SAM" deploy -t infra/template.yaml --stack-name $STACK --region $REGION --resolve-s3 --capabilities CAPABILITY_IAM \
  --parameter-overrides "${PARAMS[@]}" --no-confirm-changeset --no-fail-on-empty-changeset
SITE=$(out SiteUrl); BUCKET=$(out BucketName); DIST=$(out DistributionId)

BOT=""
if grep -q '^TELEGRAM_BOT_TOKEN=.\+' .env 2>/dev/null; then
  BOT=$("$PY" backend/scripts/telegram_setup.py "$SITE" | sed -n 's/^bot username: //p')
fi
(cd frontend && VITE_TELEGRAM_BOT="$BOT" npm run build)
aws s3 sync frontend/dist "s3://$BUCKET/" --exclude "data/*" --exclude "app" --exclude "how" --delete --region $REGION
aws s3 cp backend/smokepath/static/schools.json "s3://$BUCKET/data/static/schools.json" --region $REGION \
  --content-type application/json --cache-control "public, max-age=3600"
aws s3 cp "s3://$BUCKET/index.html" "s3://$BUCKET/index.html" --metadata-directive REPLACE \
  --content-type text/html --cache-control "no-cache" --region $REGION >/dev/null
# Client-side routes: /app (the map) and /how (the guide) are the same SPA shell, stored under their own keys.
for route in app how; do
  aws s3 cp frontend/dist/index.html "s3://$BUCKET/$route" --content-type text/html --cache-control "no-cache" --region $REGION >/dev/null
done
MSYS_NO_PATHCONV=1 aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/index.html" "/app" "/how" "/data/static/*" >/dev/null
echo "Deployed: $SITE"
