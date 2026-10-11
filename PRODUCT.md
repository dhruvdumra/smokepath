# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: school principals and admins in Delhi NCR**, on their phone in the evening (roughly 6–9 pm), deciding
  what tomorrow's school day should look like on a smoke or smog day: assembly, PE, recess, windows, messages to
  parents. Many are not technical and are 40–60 years old. (confirmed)
- **Also primary: supervisors of outdoor work sites** (construction, brick kilns, markets, loading yards) in the
  Punjab–Haryana–Delhi belt, same situation: plan tomorrow's heavy work and protection. (confirmed)
- **Evaluators: hackathon judges** (AWS Environmental Hacks, Air track) who see it on desktop in a 3-minute video and
  via the live URL. Desktop is the showcase; the phone is the real use. (confirmed)

## Product Purpose

SmokePath turns tomorrow's stubble-smoke and smog forecast into tomorrow's timetable for one specific school or work
site, the evening before, in English and Hindi. Success: a principal knows within seconds whether tomorrow needs
changes, what exactly to change, and has a message ready to forward to parents.

## Positioning

AQI apps report a city-wide average about the past; IITM's Decision Support System forecasts stubble smoke for
policymakers. SmokePath is complementary and specific: a school-level advisory that rewrites one school's timetable,
built on a bias-corrected forecast whose accuracy was measured on a real smog month.

## Operating Context

- Evening planning on a phone; Telegram bot (@coolgrid_bot, display name SmokePath) and SES email deliver the
  advisory; the web app is where a principal looks closer, changes date, copies the parent message, or subscribes.
- Data refreshes every 3 hours (EventBridge → Lambda). A replay of 11 Nov 2025 (Delhi AQI 425, GRAP Stage III invoked
  that day) is the demo episode; in October the live air is usually calm.
- Judges watch the replay: smoke streaming from Punjab fire clusters to Delhi, the "schools in Very Poor+ air at this
  hour" counter climbing from 1 to 1,034 as the timeline moves.

## Capabilities and Constraints

- Forecast: CAMS PM2.5 (Open-Meteo), 0.4° grid, corrected against ~120 CPCB monitors (OpenAQ); NOAA GFS 925 hPa
  winds; NASA FIRMS VIIRS fires; kinematic trajectories for the plume and back-trajectory smoke attribution.
- Every current feature stays (confirmed): map layers (corrected/raw PM2.5, smoke trajectories, wind, fires, schools,
  stations), timeline with play, Live/Replay switch, school search + "use my location", outdoor work-site mode (click
  map), advisory sections (hourly chart, timetable changes, checklist, share message with WhatsApp, smoke source and
  air path, "how sure are we", Telegram/email subscribe), English/Hindi toggle.
- Data colours are the official CPCB AQI category colours (Good → Severe); they stay on all pollution data.
- Rules decide every action; text is templated. Bedrock may only reword the share message.
- Stack: React 19 + Vite + TypeScript, MapLibre + deck.gl, static on S3/CloudFront; API on Lambda.

## Brand Commitments

- Name: SmokePath. Bot display name: SmokePath.
- Visual reference pinned by the user: `C:\Users\dhruv\DESIGN.md` (GitHub's dark style). It must keep that feel,
  while avoiding a "gamer" neon-on-black look and the generic AQI-app look. (confirmed)

## Evidence on Hand

- Validation (docs/validation.json): over 1,556 Delhi NCR station-days in Oct–Nov 2025, day-ahead and leave-one-station-out,
  mean error fell from 104.7 to 63.8 µg/m³ and Very Poor-or-worse days caught rose from 27% to 86%. On 11 Nov 2025:
  measured 281, raw CAMS 90, SmokePath 255.
- 1,034 real schools (OpenStreetMap), 757 VIIRS fires in the replay's prior 24 h, 120 stations used.
- No testimonials, customers, partnerships, or adoption numbers exist; never invent them.

## Product Principles

1. The answer before the explanation: "what to change tomorrow" leads; the science is one tap away.
2. Specific beats general: one school, one hour, one action, never a city average.
3. Honest about uncertainty: confidence, data age, and limits are shown, not hidden.
4. Calm, not alarming: a principal must act, not panic; severity is shown plainly.
5. Two languages as equals: Hindi is a first-class reading, not a translation footnote.

## Accessibility & Inclusion

Readable by non-technical 40–60-year-old users on phones in the evening: generous type, high contrast, no text below
14px for content, category never conveyed by colour alone, Devanagari rendering as a first-class script. (confirmed
via "too much text" and "too dark / gamer-ish" being things to avoid)
