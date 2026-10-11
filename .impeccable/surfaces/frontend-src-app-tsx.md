---
version: 1
slug: "frontend-src-app-tsx"
primary_target: "frontend/src/App.tsx"
related_targets: ["frontend/src/styles.css"]
---

# SmokePath app surface

Scope: the whole web app (map + advisory), mode Operate. Audience: Delhi NCR principals on phones in the evening;
outdoor work-site supervisors; judges on desktop. Task: know in seconds whether tomorrow needs changes, what to
change, forward the parent message, subscribe. Constraints: every current feature stays; CPCB colours on all
pollution data; no generic AQI look, no neon-gamer dark, no walls of text; must keep the GitHub DESIGN.md feel.

## Direction contract

THESIS: Tomorrow's smoke is a journey with a departure, a route and an arrival time at one school; the school day is
the ticket's status list. It refuses the AQI dashboard: big number, gauge, sidebar list of places.

OWN-WORLD: GitHub dark from the user's DESIGN.md: Deep Void #0d1117 canvas, frosted glass (white 6% fill, 1px white 10%
border, blur 20px, 24px radius), 6px buttons, 60px pills, Mona Sans 425 display / 400 body, JetBrains Mono uppercase
for codes, times and status words, Pearl #a4aea6 secondary, Sky #8dd6ff for the route and links, one Terminal Green
#08872b action, a diffused violet halo behind the ticket. The ticket has a perforated stub, hairline segments and
tabular figures. CPCB colours appear only on pollution data.

STORY: The visitor sees smoke routes streaming from Punjab into Delhi and a ticket asking "Which school?". They pick a
school; the route to it lights up with dated stops, the ticket fills with FROM fires → TO school, ARRIVES 08:00, one
status line per period, and a stub holding the parent message and alerts. They copy or forward the message and
subscribe.

FIRST VIEWPORT: Desktop 1440×900: slim 64px bar (wordmark, Live/Replay pills, language pill). Full-bleed map. The
ticket is 400px wide at the right, from 88px to the bottom, glass; arrival time is set at 48px. A timeline glass bar
spans the map's bottom with play, slider and the live "schools in Very Poor+ now" tally. The primary action, the
green "Get alerts", sits in the ticket stub. Phone 390×844: map on top; the ticket is a draggable bottom sheet
peeking at the route block. Signature interaction: picking a school draws its smoke route from departure to arrival,
the arrival time counts in, and changed periods slide to their new slot and stay lit until seen.

FORM: The Smoke Ticket (IRCTC e-ticket / PNR status), grounded candidate 5 of 7, seed 18c8345b re-roll 1, assigned;
raises kept: map dims all but the chosen route; hairline segments, no boxes in boxes; a visible hour grid; changed
rows stay lit; Today/Tomorrow flips changed times in place.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Bedrock rewording of the stub message waits on a lent account role ARN.
