# SmokePath: 3-minute demo video script

Team: The Bay Harbor Hackers (Akhil Dadipally, Rizwan Pinjari, Dhruv Dumra, Pulkit Singh). Presenter: Pulkit Singh. Target: 2:50, hard limit 3:00 (about 420 spoken words at a calm pace).

Spoken lines are in quotes. **Bold** is what's on screen.

Open these tabs first, in this order:
1. Home: https://d35jtpishdgz20.cloudfront.net
2. Map (replay): https://d35jtpishdgz20.cloudfront.net/app?dataset=replay, loaded and paused
3. Telegram Web (https://web.telegram.org) with @coolgrid_bot open, or your phone mirrored
4. `docs/architecture.svg`

---

## 0:00–0:15 · Hello

**Home page, top. Let the globe turn; the smoke line runs from Punjab into Delhi.**

> "Hi, I'm Pulkit Singh from The Bay Harbor Hackers, with Akhil Dadipally, Rizwan Pinjari and Dhruv Dumra.
> This is SmokePath. The evening before, it tells a Delhi school when crop-fire smoke will reach it tomorrow, and what to change in tomorrow's timetable."

## 0:15–0:35 · The problem

**Scroll slowly down to the arrivals board.**

> "On the 11th of November 2025, Delhi's AQI hit 425, Severe. Primary classes went hybrid that afternoon, but
> that morning kids were already standing in outdoor assemblies and running PE. The global forecast model most
> apps rely on called the air Moderate."

## 0:35–0:50 · Who it's for

**Still on the board. Hover one row.**

> "AQI apps give you a city average about the past. IITM's Decision Support System forecasts stubble smoke for
> policymakers. SmokePath is for the principal: the one person who decides what happens at school tomorrow."

## 0:50–1:45 · The demo

**Switch to the map tab. Press Play; let the smoke trails stream for about 5 seconds, then pause.**

> "Every three hours SmokePath pulls the CAMS PM2.5 forecast, NASA's fire detections and NOAA winds, and corrects
> the forecast against about 120 ground monitors. These trails come from today's fire clusters in Punjab."

**Drag the timeline from Mon 13:30 to Tue 07:30. Point at the "schools in Very Poor+ air" counter.**

> "As the smoke and the night-time inversion arrive, the counter climbs to all 1,034 schools."

**Type "Sardar Patel" in "Which school?" and pick it. Pause while the route draws.**

> "Pick a school and you get a ticket. Smoke from crop fires near Sangrur, Moga and Malerkotla reaches Sardar
> Patel Vidyalaya at 8 am: Severe, six changes. Assembly indoors, PE indoors, recess indoors, gates open early."

**Point at the dated stops on the route.**

> "Every stop is a real fire cluster this air passed over, with the time it was there."

**Scroll the ticket to the parents' stub. Click Copy, hover WhatsApp.**

> "And a message for parents, ready for the class WhatsApp group."

**Click हिंदी.**

> "Everything works in Hindi too."

*If you're over time, cut this beat.* **Back → "Outdoor work site" → click near Okhla.**

> "It also works for construction sites: heavy work moves to the afternoon, and N95s for the whole crew."

## 1:45–2:05 · Telegram

**Telegram: /start → share location → tap the school → the ticket arrives. Then /demo.**

> "Principals don't have to open a website. They scan the QR on our home page or the staff-room poster, share
> their location, tap their school, and the ticket arrives the evening before every bad-air day. Email works
> too, through Amazon SES."

## 2:05–2:30 · Built on AWS

**Show `docs/architecture.svg`.**

> "It's fully serverless in Mumbai, from one AWS SAM template. EventBridge Scheduler runs an ingest Lambda every
> three hours, and the monitor history comes from the OpenAQ archive on the AWS Open Data Registry. The forecast
> goes to S3 behind CloudFront. An API Gateway Lambda serves advisories and the Telegram bot, DynamoDB holds
> subscriptions, and SES sends email. Amazon Bedrock with Claude is wired in to rewrite the parent message. Our
> AWS account is new and its Bedrock quota is still zero, so today you're seeing the template version. It
> switches on with one setting."

## 2:30–2:50 · Does it work?

**Home page, the proof section (90 / 281 / 255).**

> "We tested it on a month of real data, predicting each monitor without using it. Error fell by 39 percent,
> and Very Poor days caught rose from 27 to 86 percent. On the 11th, the global model said 90. SmokePath, the
> evening before, said 255. The monitors measured 281."

## 2:50–3:00 · Close

**Back to the map with the ticket open.**

> "It's a school-level advisory, not a street sensor, and it never closes a school. It tells you what to change
> tomorrow. SmokePath is live at the link below. Thank you."

---

### Recording checklist

- [ ] Replay loaded and paused before you start talking. The first load is about 900 KB.
- [ ] Telegram: subscribed to a school once beforehand, so /demo answers instantly.
- [ ] Browser full screen at 100% zoom; bookmarks bar hidden; Windows notifications off (Focus).
- [ ] Record one section per take, then join the takes. Keep the final cut under 3:00.
