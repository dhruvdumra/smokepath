# SmokePath — build plan

**One line:** IITM's Decision Support System forecasts how much stubble burning adds to Delhi's air for policymakers; SmokePath turns tomorrow's smoke forecast into tomorrow's timetable for one specific school.

Deadline: Sun 2026-10-11 evening IST. Code freeze Sun ~14:00, then video + README + blog.

## What the product does

1. **Forecast.** CAMS PM2.5 (Open-Meteo, hourly, 72 h) on a 0.4° grid over Punjab–Haryana–Delhi.
2. **Correct.** CAMS underestimates Delhi badly on smoke days (18 Nov 2024: CAMS 50–160 µg/m³, observed AQI 494).
   Each run learns an obs/CAMS ratio per CPCB station from the last 24 h (OpenAQ), spreads it to schools by
   inverse-distance weighting, and applies it to the forecast. Validated on the Nov 2024 replay (raw vs corrected MAE + category hit rate).
3. **Explain.** NASA FIRMS VIIRS fires → clusters. GFS 925 hPa winds → forward particle trajectories from fire
   clusters (animated plume) and back-trajectories from Delhi arrival points → "air reaching this school at 10:00
   tomorrow passed over fires near Sangrur ~20 h earlier". Qualitative attribution only; IITM DSS does the quantitative share.
4. **Advise.** A deterministic rules engine maps hourly corrected PM2.5 at each school onto that school's timetable
   (assembly, PE, recess, arrival/dispersal) → concrete actions: move PE to the cleanest window or indoors,
   shut windows during bad hours / ventilate in the cleanest hour, keep sensitive students in, N95 for outdoor staff,
   GRAP heads-up. English + Hindi templates. Bedrock path wired but off (account quota = 0).
5. **Alert.** Telegram bot (share location → nearest school → subscribe; /tomorrow) + SES email to the school admin.
   SNS SMS shown as the production path (needs DLT registration in India).

Honest scope: CAMS is ~45 km, so this is a **school-level advisory**, not a street-level forecast. Schools can't
close themselves (GRAP orders are government decisions), so we only recommend actions within the school's control.

## AWS architecture (SAM, ap-south-1)

- EventBridge Scheduler (every 6 h) → **Lambda `ingest`**: Open-Meteo CAMS + GFS, FIRMS, OpenAQ → correct →
  trajectories → advisories → `bundle.json` in **S3**; alerts via Telegram + **SES**.
- **CloudFront** → S3 static site (React) + `/data/*` bundles.
- **API Gateway HTTP API** → **Lambda `api`**: `/advisory/{school}`, `/subscribe`, `/telegram` webhook.
- **DynamoDB**: subscriptions + alert de-duplication.
- **SSM Parameter Store**: Telegram token, FIRMS key, OpenAQ key.
- OpenAQ archive read from the AWS Open Data Registry (`s3://openaq-data-archive`) for replay.
- Lambdas use the standard library only (urllib + boto3), so `sam build` needs no container.

## Milestones

- M0 scaffold: repo, SAM, SES verify, secrets — Sat 12:00–12:45
- M1 data core: sources, correction, trajectories, attribution, advisor, pipeline; replay validation — Sat 12:45–17:00
- M2 frontend: map + animated plume + timeline slider + school panel + EN/HI — Sat 17:00–22:00
- M3 AWS deploy: SAM template, CloudFront, scheduler, API — Sat 22:00–Sun 01:00
- M4 alerts: Telegram bot + SES — Sun 08:00–10:30
- M5 polish: README, architecture diagram, video script, blog draft — Sun 10:30–14:00, then record

## Rubric mapping

- **Idea/Impact:** real gap (city averages → school timetables), honest about prior work (IITM DSS, SAFAR, GRAP).
- **Built on AWS:** deployed serverless stack + SAM CLI (AWS open source) + Open Data Registry.
- **Design/Usability:** "My School" view a principal can use in 10 s; Telegram onboarding by sharing location.
- **Execution:** live pipeline on a schedule + deterministic replay of a real episode.
- **Video:** 3-min script in `docs/video-script.md`.
