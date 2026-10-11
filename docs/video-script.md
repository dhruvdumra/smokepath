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

**Open Layers (top right) → pick "Raw model PM2.5", then back to "Station-corrected PM2.5". Close Layers.**

## 0:20–0:40 · Who it's for

> "SmokePath is for the person who actually decides what happens at school tomorrow: the principal. AQI apps
> give a city average about the past. IITM's Decision Support System forecasts stubble smoke for policymakers.
> SmokePath turns that kind of forecast into tomorrow's timetable for one school."

## 0:40–1:35 · Demo on the web

**Press Play. Let the smoke trails stream from Punjab to Delhi for about 5 s, then pause.**

> "Every three hours, SmokePath pulls the CAMS PM2.5 forecast, NASA's VIIRS fire detections and NOAA winds.
> These trails are trajectories from today's fire clusters. They explain where the smoke is going; the forecast
> itself comes from CAMS."

**Drag the timeline from Mon 13:30 to Tue 07:30. Point at the "schools in Very Poor+ air" counter going 1 → 1,034.**

> "Watch the counter: as the smoke and the night-time inversion arrive, every school's advisory switches on."

**In the ticket's "Which school?" field type "Sardar Patel" and select it. Pause while the route draws itself.**

> "Pick a school and SmokePath issues a ticket. The smoke left crop fires near Sangrur, Moga and Malerkotla,
> and it arrives at Sardar Patel Vidyalaya at 8 am Tuesday: Severe, six timetable changes. Assembly indoors,
> PE indoors, recess indoors, gates open early so kids don't wait outside."

**Scroll the ticket to the stub ("For parents"). Click Copy, hover WhatsApp.**

> "And a ready message for parents, because that's how Indian schools actually reach them: WhatsApp."

**Point at the route on the map: the dated stops (Moga 08:00 → Malerkotla 12:00 → Sangrur 17:00 → school 08:00).**

> "Every stop is a real fire cluster the incoming air passed over, with the time it was there."

**Back → in the ticket choose "Outdoor work site" → click near Okhla on the map.**

> "It isn't only schools. Click any construction site: heavy work moves to 2 to 5 pm, N95s for everyone, a
> sheltered break every hour, and a Hindi message for the workers."

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
