# SmokePath

**Tomorrow's smoke forecast, turned into tomorrow's timetable for one school.**

AWS Environmental Hacks 2026 · Air track (stubble burning, school safety on bad days)

Live: https://d35jtpishdgz20.cloudfront.net · Replay of the Nov 2024 Delhi smog: https://d35jtpishdgz20.cloudfront.net/?dataset=replay

---

## The problem

Every October–November, smoke from paddy-stubble fires in Punjab and Haryana joins Delhi's own pollution. AQI apps
tell people how bad the air *was*, as a city-wide average. A school principal deciding at 6 pm whether tomorrow's
assembly and PE should go ahead outdoors gets no usable answer. Official school closures under GRAP arrive after
the air is already Severe, and only cover the worst days.

**Prior work, credited.** IITM Pune's Decision Support System and the Air Quality Early Warning System forecast
Delhi's air and how much stubble burning contributes, for policymakers. SmokePath is complementary: it takes that
kind of forecast and turns it into **"move PE to 12:50, hold assembly indoors, shut windows 07:00–11:00"** for
School #42.

## What it does

1. **Forecast.** CAMS global PM2.5 (via Open-Meteo), hourly, 48 h ahead, on a 0.4° grid over Punjab–Haryana–Delhi.
2. **Correct.** Raw CAMS badly under-predicts Delhi smog. On 18 Nov 2024 CAMS said 50–160 µg/m³ while Delhi's AQI
   was 494. Every run learns an observed/CAMS ratio at each CPCB monitor over the last 24 h (OpenAQ), spreads it to
   every school by inverse-distance weighting in log space, and applies it to the forecast. See
   [Validation](#validation) for whether this helps.
3. **Explain.** NASA FIRMS VIIRS fire detections plus NOAA GFS 925 hPa winds drive kinematic trajectories:
   - forward from fire clusters, giving the animated plume on the map;
   - back from each school, answering "the air arriving at 10:00 passed over 212 fires near Sangrur ~19 h earlier".
   This is qualitative attribution only. IITM's DSS does the quantitative source share.
4. **Advise.** A deterministic, auditable rules engine maps hourly corrected PM2.5 onto the school's timetable
   (arrival, assembly, PE, recess, dispersal):
   - **Timetable:** moves PE to the cleanest window, or indoors.
   - **Building:** windows shut in bad hours, ventilation in the cleanest hour.
   - **People:** keep sensitive students in, N95s for gate and bus staff.
   - **GRAP heads-up:** flagged when the daily mean reaches Stage III/IV range.

   Output is in English and Hindi, plus a ready-to-forward WhatsApp message for parents.
5. **Alert.**
   - **Telegram bot:** share your location, pick your school, get the advisory. Evening alerts follow before bad days.
   - **SES email:** the same alert for school admins.
   - **SMS (production path):** Amazon SNS, which in India needs DLT sender registration, so it's out of scope for the demo.

### Honest scope

- CAMS is a ~45 km grid, so this is a **school-level advisory, not a street-level measurement**.
- Schools cannot close themselves; GRAP orders are a government decision. SmokePath only recommends actions within
  a school's control and flags when an official order becomes likely.
- No Gaussian plume model. Those are valid for a few km from a chimney, not for 200–300 km transport over 1–2 days.
  CAMS already includes satellite fire emissions (GFAS); our trajectories explain the forecast rather than replace it.
- Thresholds are CPCB PM2.5 category breakpoints applied to hourly values as guidance bands (CPCB defines them on
  24 h means). They are configurable defaults, not medical advice.

## Architecture (all serverless, `ap-south-1` Mumbai)

```
EventBridge Scheduler (every 3 h, IST)
        │
        ▼
Lambda smokepath-ingest ──► Open-Meteo (CAMS PM2.5, GFS winds)
        │                ──► NASA FIRMS (VIIRS fires)
        │                ──► OpenAQ v3 / OpenAQ archive on AWS Open Data Registry (CPCB monitors)
        │  bias-correct → trajectories → per-school summary
        ▼
S3 bundle (data/live/latest.json) ──► CloudFront ──► React + MapLibre + deck.gl site
        │                                  │
        │                                  └─ /api/* ─► API Gateway HTTP API ─► Lambda smokepath-api
        │                                                   (advisory, subscribe, Telegram webhook)
        ▼
alerts: Telegram Bot API · Amazon SES  (Amazon SNS SMS = production path, needs DLT)
DynamoDB: subscriptions + alert de-duplication · SSM Parameter Store: API keys
Amazon Bedrock: optional wording path (wired; new-account token quota is 0, so templates are used)
```

- Infrastructure is one AWS SAM template: [`infra/template.yaml`](infra/template.yaml). SAM CLI is an AWS open-source tool.
- Both Lambdas use only the Python standard library plus boto3, so there are no layers or container builds.

## Validation

_Filled in from `backend/scripts/validate_correction.py` (day-ahead, leave-one-station-out on Nov 2024)._

## Run it

```bash
# backend (local)
uv venv .venv && uv pip install --python .venv/Scripts/python.exe boto3 pytest
.venv/Scripts/python.exe backend/scripts/build_local.py replay 2024-11-12T12:00
.venv/Scripts/python.exe backend/scripts/dev_server.py        # :8787
# frontend
cd frontend && npm install && npm run dev                              # :5173
# deploy everything
./deploy.sh
```

Secrets go in `.env` (see `.env.example`); `deploy.sh` pushes them to SSM Parameter Store.

## Data sources and licences

- **CAMS global forecasts:** Copernicus Atmosphere Monitoring Service, via Open-Meteo (CC BY 4.0)
- **NOAA GFS:** via Open-Meteo
- **NASA FIRMS VIIRS active fires:** NASA LANCE/FIRMS
- **CPCB monitors:** OpenAQ v3 and the OpenAQ archive on the AWS Open Data Registry
- **Schools:** © OpenStreetMap contributors (ODbL), `amenity=school`
- **Basemap:** CARTO Dark Matter

## Built with AI assistance

Code was written with Claude Code (Anthropic) under the author's direction. Design decisions, scope and data
choices were reviewed by the author.
