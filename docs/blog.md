# The forecast said "Moderate". It was Severe. Building SmokePath on AWS

*How a weekend project turns stubble-smoke forecasts into tomorrow's timetable for one Delhi school, and what
I learned when I checked the numbers.*

---

## The 6 pm question nobody answers

Every October and November, smoke from paddy-stubble fires in Punjab and Haryana drifts over Delhi and mixes with
the city's own pollution. On **Tuesday 11 November 2025** Delhi's AQI reached 425 ("Severe"), and that afternoon
the Commission for Air Quality Management invoked GRAP Stage III. Primary classes moved to hybrid mode.

The person who needed to know first was a school principal, the evening before, deciding whether tomorrow's
assembly and PE should go ahead outdoors. AQI apps show a city-wide average about the past. IITM's Decision Support
System forecasts how much stubble burning adds to Delhi's air, but it is built for policymakers. Nobody turns that
forecast into "move PE to 12:50, hold assembly indoors, shut windows until 11".

So I built **SmokePath** for the AWS Environmental Hacks (Air track).

## What it does

Pick a school (1,034 real Delhi NCR schools from OpenStreetMap) and SmokePath shows:

- the hourly PM2.5 forecast for the school day;
- **timetable changes**: assembly, PE, recess, arrival and dispersal, each kept, moved to the cleanest window,
  or brought indoors;
- a checklist for the principal: windows, purifiers, sensitive students, N95s for gate staff, and a GRAP heads-up;
- a ready-to-forward **WhatsApp message for parents**, in English and Hindi;
- **where the smoke came from**, e.g. "air arriving at 8 am passed over 80 fire detections near Sangrur ~15 h earlier".

A Telegram bot does the same with no website. Share your location, tap your school, and the alert arrives the
evening before a bad day.

## The finding that changed the design

My first plan was to show the CAMS global PM2.5 forecast (free via Open-Meteo) at each school. Then I checked it
against reality. For 11 Nov 2025, CAMS forecast **90 µg/m³** for Delhi NCR. CPCB monitors measured **281**.
Raw CAMS would have told schools "Moderate" on the season's worst day.

So every run now **bias-corrects CAMS against 120 CPCB ground monitors**:

1. For each monitor, learn the ratio observed/CAMS over the last 24 h.
2. Spread those ratios to every school by inverse-distance weighting in log space. Far from monitors, the
   correction relaxes to the regional median.
3. Apply the ratio to the next day's forecast.

Then I tested whether it actually helps at places *without* a monitor, which is what a school is:
- I predicted every monitor's next day using only the other monitors.
- I covered 1,556 station-days, 25 Oct – 25 Nov 2025.

| | Raw CAMS | Corrected |
|---|---|---|
| Mean absolute error | 104.7 µg/m³ | **63.8** |
| Exact CPCB category | 19% | **52%** |
| Very Poor-or-worse days caught | 27% | **86%** |

On 11 November, SmokePath's forecast issued the evening before said **255 µg/m³**, Severe and in the GRAP III range.

It isn't magic. The method assumes yesterday's bias persists, so it fails when the weather flips. On 31 October it
said 194 when the monitors read 97. I put that in the README too.

## Where AWS fits

Everything is serverless in Mumbai (`ap-south-1`) and deployed from one **AWS SAM** template:

- **Amazon EventBridge Scheduler** runs the ingest **AWS Lambda** every 3 hours (IST). It pulls CAMS PM2.5 and GFS
  winds (Open-Meteo), NASA FIRMS VIIRS fires, and CPCB monitors, then corrects the forecast, computes the trajectories,
  and writes one JSON bundle to **Amazon S3**.
- The CPCB history for the replay and validation comes from the **OpenAQ archive on the AWS Open Data Registry**:
  public S3, no key, read straight from Lambda.
- **Amazon CloudFront** serves the React + MapLibre + deck.gl site and the bundle, and routes `/api/*` to an
  **Amazon API Gateway** HTTP API backed by a second Lambda. That Lambda serves advisories and the Telegram webhook.
- **Amazon DynamoDB** stores subscriptions and de-duplicates alerts. **Amazon SES** sends email.
  **AWS Systems Manager Parameter Store** holds API keys.
- **Amazon SNS** SMS is the production path. Bulk SMS in India needs a DLT-registered sender, so the demo uses
  Telegram and email.
- **Amazon Bedrock** is wired in to reword the parent message, with the rules engine deciding every action. A new
  account has a daily token quota of zero, so the deterministic templates run today.

Both Lambdas use only the Python standard library plus boto3, so there are no layers or container builds. A full
run takes about 15 s of compute plus the time spent waiting on rate-limited APIs.

## Things I chose not to claim

- **No Gaussian plume model.** Those are valid a few kilometres from a chimney, not 250 km over two days. The
  trajectories explain the CAMS forecast; they don't replace it.
- **School-level, not street-level.** CAMS is a ~45 km grid, and the correction sharpens it near monitors.
- **No school closures.** Closures under GRAP are a government decision. SmokePath only recommends what a school
  can change itself, and warns when an order looks likely.

## Try it

- Live: https://d35jtpishdgz20.cloudfront.net
- Replay of 11 Nov 2025: https://d35jtpishdgz20.cloudfront.net/?dataset=replay
- Code: *(GitHub link)*

*Data: CAMS (Copernicus) via Open-Meteo; NOAA GFS; NASA FIRMS; CPCB via OpenAQ; © OpenStreetMap contributors.*
