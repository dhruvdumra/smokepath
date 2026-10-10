# SmokePath: 3-minute demo video script

Target: 2:50. Record at 1440×900, browser zoom 100%, dark OS theme. Open these in tabs before recording:
1. https://d35jtpishdgz20.cloudfront.net/?dataset=replay
2. Telegram on your phone (screen-mirrored) or Telegram Desktop with @coolgrid_bot open
3. `docs/architecture.svg`

Spoken lines are in quotes. **Bold** is what's on screen.

---

## 0:00–0:20 · The problem

**Replay tab, map only, timeline at Mon 10 Nov 17:30.**

> "On Tuesday the 11th of November 2025, Delhi's AQI hit 425 — 'Severe'. That afternoon the government ordered
> primary classes into hybrid mode. But that morning, across Delhi, kids were already standing in outdoor
> assemblies and running PE periods. The global forecast model most apps rely on said the air would be 'Moderate'."

**Toggle the legend to "Raw CAMS PM2.5", then back to "Station-corrected".**

## 0:20–0:40 · Who it's for

> "SmokePath is for the person who actually decides what happens at school tomorrow: the principal. AQI apps
> give a city average about the past. IITM's Decision Support System forecasts stubble smoke for policymakers.
> SmokePath turns that kind of forecast into tomorrow's timetable for one school."

## 0:40–1:35 · Demo on the web

**Press Play. Let the smoke trails stream from Punjab to Delhi for about 5 s, then pause.**

> "Every three hours, SmokePath pulls the CAMS PM2.5 forecast, NASA's VIIRS fire detections and NOAA winds.
> These trails are trajectories from today's fire clusters. They explain where the smoke is going; the forecast
> itself comes from CAMS."

**Type "Sardar Patel" in the search box and select it.**

> "Pick a school. Tuesday: Severe from 7 to 2, peak at 8 am, six timetable changes. Assembly indoors, PE
> indoors, recess indoors, gates open early so kids don't wait outside, N95s for the gate staff."

**Scroll to "Message for parents". Click Copy, hover "Share on WhatsApp".**

> "And a ready message for parents, because that's how Indian schools actually reach them: WhatsApp."

**Scroll to "Where the smoke comes from". Click "Show the air path on the map".**

> "Why? The air arriving at 8 am passed over 80 fire detections near Sangrur, Moga and Malerkotla about 15 hours earlier."

**Click the हिंदी button.**

> "Everything works in Hindi too."

## 1:35–2:00 · Telegram

**Phone or Telegram Desktop: /start → Share location → tap the school → the advisory arrives. Then /demo.**

> "Principals don't need to open a website. On Telegram, share your location, tap your school, and you'll get
> this the evening before every bad-air day. Email works too, through Amazon SES."

## 2:00–2:30 · Where AWS fits

**Show `docs/architecture.svg`.**

> "It's fully serverless in Mumbai, deployed with one AWS SAM template. EventBridge Scheduler runs an ingest
> Lambda every three hours. The ground-station data comes from the OpenAQ archive on the AWS Open Data Registry.
> The forecast bundle goes to S3 behind CloudFront. A second Lambda behind API Gateway serves advisories and
> the Telegram webhook. DynamoDB holds subscriptions, SES sends email, and SNS SMS is the production path once
> we have DLT registration."

## 2:30–2:50 · Does it work?

**README Validation table on screen.**

> "Raw CAMS under-predicts Delhi smog badly, so every run corrects it against 120 CPCB monitors. We tested this
> on a month of real data, predicting each monitor without using it: error down 39%, and Very Poor days caught
> went from 27% to 86%. On the 11th, raw CAMS said 90; SmokePath said 255, the evening before. Measured: 281."

## 2:50–3:00 · Close

**Back to the map.**

> "It's a school-level advisory, not a street-level sensor, and it never tells a school to close. It tells
> them what to change tomorrow. SmokePath is live at the link below."

---

### Recording checklist

- [ ] Replay loaded and paused before you start talking. The first load is ~900 KB.
- [ ] Telegram: subscribed to a school once beforehand, so /demo answers instantly.
- [ ] Hide bookmarks bar and notifications.
- [ ] Keep it under 3:00; the rubric says three minutes.
