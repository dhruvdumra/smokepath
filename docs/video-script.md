# SmokePath: 3-minute demo video script

Team: The Bay Harbor Hackers (Pulkit Singh, team leader; Akhil Dadipally; Rizwan Pinjari; Dhruv Dumra). Presenter: Pulkit Singh.

Two parts: Pulkit explains everything straight to camera (about 1:30), then the screen takes over with light
background commentary (about 1:25). Target 2:55, hard limit 3:00.

Open these tabs first: the home page, `/app?dataset=replay` (loaded and paused), Telegram Web with @coolgrid_bot,
and `docs/architecture.svg`.

---

## Part 1 · The explanation (0:00–1:30)

Pulkit on camera. If you'd rather do voice-over, show the home page while talking, the architecture diagram during
the AWS paragraph, and the 90 / 281 / 255 section during the last paragraph.

> "Hi, I'm Pulkit Singh, team leader of The Bay Harbor Hackers, with Akhil Dadipally, Rizwan Pinjari and Dhruv
> Dumra. This is SmokePath.
>
> Every winter, smoke from crop fires in Punjab drifts into Delhi. On the 11th of November 2025, Delhi's AQI hit
> 425, Severe. That morning, kids were already standing in outdoor assemblies and running PE, because the global
> forecast had called the air Moderate.
>
> AQI apps describe the past, for a whole city. SmokePath tells one school, the evening before, when tomorrow's
> smoke will arrive and what to change: assembly, PE, recess, gate timing. It covers 1,034 schools across Delhi
> NCR, in English and Hindi, on the web and on Telegram.
>
> Under the hood, it's serverless on AWS. Every three hours, EventBridge Scheduler runs a Lambda that pulls the
> global smoke forecast, NASA fire data and wind forecasts, and corrects it using about 120 government air
> monitors. The results go to S3 behind CloudFront. API Gateway and a second Lambda serve the advisories and
> our Telegram bot, DynamoDB stores subscriptions, and SES sends email alerts. Amazon Bedrock with Claude is built
> in to write the parent message. Our account is new and its Bedrock quota is still zero, so today you'll see the
> template version.
>
> Does it work? We tested it on a month of real monitor data from the AWS Open Data Registry. Our error was 39 percent lower than the raw model, and we caught 86 percent of Very Poor days instead
> of 27. Let me show you."

---

## Part 2 · The showcase (1:30–2:55)

Screen only. Keep the commentary light; let the product do the talking.

| Time | On screen | Commentary |
|---|---|---|
| 1:30 | Map tab. Press Play; let the trails run for about 5 s. | "This is a replay of a real smog day in Delhi. The lines show smoke moving from crop fires in Punjab toward the city." |
| 1:40 | Drag the timeline from Mon 13:30 to Tue 07:30; point at the counter. | "As the night goes on, more and more schools fall into bad air." |
| 1:50 | Type "Sardar" in the search and pick the first school. Let the route draw. | "Now I pick a school. SmokePath gives it a ticket: where the smoke comes from, when it arrives, 8 am, and how bad it will be." |
| 2:05 | Scroll the ticket's period list. | "Below that, what to change in each period: assembly, PE and recess move indoors." |
| 2:15 | Scroll to the parents' message. Click Copy, hover WhatsApp. | "One tap copies a message for parents." |
| 2:20 | Click हिंदी. | "It all works in Hindi too." |
| 2:25 | *Optional, cut if over time:* Back → "Outdoor work site" → click anywhere in the city. | "And it works for construction sites too." |
| 2:30 | Telegram: /start → share location → tap the school → the ticket arrives. | "Principals can also get this on Telegram. Share your location, pick your school, and the alert comes the evening before." |
| 2:45 | Home page, top. | "That's SmokePath: know tomorrow's air today, and plan the school day around it. Thank you." |

---|---|---|
| 1:30 | Map tab. Press Play; let the trails stream for about 5 s. | "This is the replay of the 11th of November. The trails show smoke moving from the Punjab fires toward Delhi." |
| 1:40 | Drag the timeline from Mon 13:30 to Tue 07:30; point at the counter. | "Overnight, school after school slips into Very Poor air." |
| 1:50 | Type "Sardar Patel" in "Which school?" and pick it. Let the route draw. | "Here's one school's ticket. Smoke from fires near Sangrur, Moga and Malerkotla arrives at 8 am. Severe, six changes to the day." |
| 2:05 | Point at the dated stops on the route, then scroll the ticket's period list. | "Each stop is a real fire cluster this air passed over. Assembly, PE and recess move indoors; gates open early." |
| 2:15 | Scroll to the parents' stub. Click Copy, hover WhatsApp. | "One tap copies a message for the parents' WhatsApp group." |
| 2:20 | Click हिंदी. | "All of it in Hindi." |
| 2:25 | *Optional, cut if over time:* Back → "Outdoor work site" → click near Okhla. | "It works for construction sites too." |
| 2:30 | Telegram: /start → share location → tap the school → the ticket arrives. | "Principals don't even need the website. Scan the QR, share your location, pick your school, and the ticket arrives on Telegram the evening before." |
| 2:45 | Home page, top, with the globe turning. | "SmokePath. It never closes a school; it tells you what to change tomorrow. It's live at the link below. Thank you." |

---

### Recording checklist

- [ ] Replay loaded and paused before you start. The first load is about 900 KB.
- [ ] Telegram: subscribed to a school once beforehand, so the bot answers instantly.
- [ ] Browser full screen at 100% zoom; bookmarks bar hidden; Windows notifications off (Focus).
- [ ] Record Part 1 and Part 2 as separate takes (Part 2 can be several short takes), then join them in Clipchamp.
- [ ] Final cut under 3:00. Export at 1080p, upload to YouTube as Unlisted.
