---
name: SmokePath
description: Tomorrow's stubble smoke as a journey ticket to one school, on a GitHub-dark glass map.
colors:
  deep-void: "#0d1117"
  obsidian: "#151a22"
  slate-edge: "#21262d"
  fog: "#484f58"
  mercury: "#818b98"
  pearl: "#a4aea6"
  snow: "#ffffff"
  terminal-green: "#08872b"
  terminal-green-hover: "#0b9c33"
  sky: "#8dd6ff"
  sky-wash: "rgba(141, 214, 255, 0.14)"
  violet: "#8c93fb"
  line: "rgba(255, 255, 255, 0.1)"
  line-strong: "rgba(255, 255, 255, 0.16)"
  ember-pin: "#e03131"
  cpcb-good: "#00B050"
  cpcb-satisfactory: "#92D050"
  cpcb-moderate: "#FFFF00"
  cpcb-poor: "#FF9900"
  cpcb-very-poor: "#FF0000"
  cpcb-severe: "#C00000"
typography:
  display:
    fontFamily: "'Mona Sans', 'Noto Sans Devanagari', ui-sans-serif, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 425
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "'tnum' on, 'ss01' on, 'cv11' on"
  headline:
    fontFamily: "'Mona Sans', 'Noto Sans Devanagari', ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 425
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Mona Sans', 'Noto Sans Devanagari', ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 1.35
  section:
    fontFamily: "'Mona Sans', 'Noto Sans Devanagari', ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.005em"
  body:
    fontFamily: "'Mona Sans', 'Noto Sans Devanagari', ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "11.5px"
    fontWeight: 400
    letterSpacing: "0.06em"
  code:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0.04em"
rounded:
  hairline: "4px"
  button: "6px"
  input: "8px"
  popover: "14px"
  featured: "16px"
  card: "24px"
  pill: "60px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.terminal-green}"
    textColor: "{colors.snow}"
    rounded: "{rounded.button}"
    padding: "0 14px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.terminal-green-hover}"
  button-outline:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    textColor: "{colors.snow}"
    rounded: "{rounded.button}"
    padding: "0 14px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.pearl}"
    rounded: "{rounded.button}"
    padding: "0 14px"
    height: "36px"
  pill:
    backgroundColor: "transparent"
    textColor: "{colors.pearl}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "32px"
  pill-selected:
    backgroundColor: "rgba(255, 255, 255, 0.1)"
    textColor: "{colors.snow}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.pearl}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "30px"
  input:
    backgroundColor: "{colors.obsidian}"
    textColor: "{colors.snow}"
    rounded: "{rounded.input}"
    padding: "0 14px"
    height: "44px"
  ticket:
    backgroundColor: "rgba(13, 17, 23, 0.8)"
    textColor: "{colors.snow}"
    rounded: "{rounded.card}"
    padding: "20px 24px 24px"
    width: "408px"
  category-pill:
    typography: "{typography.section}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  featured-card:
    backgroundColor: "rgba(140, 147, 251, 0.07)"
    rounded: "{rounded.featured}"
    padding: "12px 14px"
---

# Design System: SmokePath

## Overview

**Creative North Star: "The Smoke Ticket"**

SmokePath sets tomorrow's stubble smoke as a journey to one school. It has a departure (the fires), a route across the map, an arrival time and a status list for the school day. The world comes from GitHub's dark product language: a Deep Void canvas, frosted glass laid over a live map, Mona Sans at weight 425, JetBrains Mono for stamped codes, and one green action. The ticket idiom (FROM / TO fields, a perforated stub, hairline rows, tabular figures) carries the information. The page has no dashboard chrome.

The map is the ground and runs full-bleed. Glass objects float over it: the ticket, the timeline bar and the top bar's pill group. Everything outside pollution data stays greyscale, and Sky marks the route plus anything the user can follow. CPCB category colours are the only warm or saturated colours on screen, apart from the red FROM pin, so pollution always reads as pollution.

The density suits an operator: someone who has to decide in seconds on a phone in the evening. Data sits in hairline rows, never in boxes inside boxes. Motion stays functional (the route draws itself, the arrival time counts in, changed times flip) and all of it switches off under reduced motion.

**Key Characteristics:**
- Full-bleed dark map with glass objects floating over it, never a sidebar layout.
- One ticket: FROM / TO rail, ARRIVES time, CPCB pill, hour grid, status rows, remarks, perforated stub.
- Two shapes: 60px pills for navigation and tags, 6px rectangles for actions, 24px for glass cards.
- Greyscale chrome with three signals: Sky (route, links, focus), Terminal Green (the one action), CPCB (pollution).
- Mono uppercase only for field labels, times and status codes. Devanagari never gets uppercase or tracking.

## Colors

A near-black, greyscale world where colour is a signal, never decoration.

### Primary
- **Terminal Green** (`terminal-green`): the single primary action on any screen, the ticket stub's "Telegram alerts" button, and the accent colour of the remarks checkboxes. It brightens on hover (`terminal-green-hover`). Nothing else is green, apart from CPCB Good/Satisfactory data and the Live status dot.

### Secondary
- **Sky** (`sky`): the selected smoke route on the map, the dashed FROM→TO rail on the ticket, links, the "more" disclosures, forecast-lead text, the timeline's issue-time marker, the caret and the focus ring. **Sky Wash** (`sky-wash`) lights changed status rows until they have been seen.

### Tertiary
- **Halo Violet** (`violet`): appears in only two places. One is the 1px border, label and 7% fill of the GRAP featured card in the remarks. The other is the blurred radial halo behind the desktop ticket (60px blur, never a fill).

### Neutral
- **Deep Void** (`deep-void`): the canvas, the route casing under the Sky line on the map, the perforation notches, text colour on light CPCB fills, and the base under the glass.
- **Obsidian** (`obsidian`): input and search-field fill, a little lifted off the glass.
- **Slate Edge** (`slate-edge`): input borders at rest.
- **Fog** (`fog`): the quietest structure, used for timeline ticks, the sheet handle and scrollbar thumbs.
- **Mercury** (`mercury`): mono field labels, hour-grid captions, placeholders, fine print, completed remarks.
- **Pearl** (`pearl`): the workhorse secondary text, used for sub-copy, notes, inactive pills and status codes.
- **Snow** (`snow`): primary text, the arrival time, the TO pin ring and the timeline thumb.
- **Line / Line Strong** (`line`, `line-strong`): white hairlines at 10% for card edges and row dividers, and 16% for buttons, pills and popovers.

### Data colours
- **CPCB categories** (`cpcb-good` to `cpcb-severe`): the official CPCB National AQI colours. One table in `lib/colors.ts` feeds the category pills, the hour-strip bars, the school dots and the map heat raster. The raster's opacity grows with concentration (6% to 62%). Ink on each fill is Deep Void, except Severe, which takes Snow.
- **Ember Pin** (`ember-pin`): the FROM origin. It appears as the ticket's red pin with a 3px 22% ring, the route's start terminus, and the dated stop dots on the map.
- Map-only data hues: smoke trajectories in a warm parchment (`rgb(255,214,170)`, 50% opacity) and VIIRS fires in orange (`rgb(255,110,30)`), which fade over 24 h.

### Named Rules
**The Pollution-Owns-Colour Rule.** Saturated warm colour appears only on pollution data, in the official CPCB colours from the single table. Chrome never borrows a CPCB colour, and pollution data never gets a custom palette.

**The One Green Rule.** Terminal Green marks one action per view. If a second thing wants to be green, it becomes an outline button.

**The Sky Is the Path Rule.** Sky means "route, link, or where focus is". Use it nowhere else.

## Typography

**Display Font:** Mona Sans (variable 200–900, with ui-sans-serif / system-ui fallback)
**Body Font:** Mona Sans, with Noto Sans Devanagari in the same stack for Hindi
**Label/Mono Font:** JetBrains Mono (400/500)

**Character:** Mona Sans at weight 425 gives an engineered voice, lighter than bold but firmer than regular. JetBrains Mono stamps the ticket's machine-issued fields the way a PNR printout would. Stylistic sets `ss01` and `cv11` are on throughout.

### Hierarchy
- **Display** (425, 48px, 1, -0.035em, tabular): the ARRIVES time only. It drops to 40px on phones.
- **Headline** (425, 28px, 1.18, -0.02em, balanced): the intro question and the timeline tally figure. 24px on phones for the intro (20px for the tally).
- **Title** (500, 17px, 1.35): FROM / TO field values.
- **Section** (600, 15px): in-ticket section titles ("Timetable", "PM2.5 through the day"), status row names at weight 500, and the timeline's current time.
- **Body** (400, 15px, 1.5; base 16px): sub-copy, remarks, messages. Fine print uses 13px in Mercury.
- **Label** (JetBrains Mono 400, 11.5px, 0.06em, uppercase, Mercury): ticket field labels FROM, TO, ARRIVES.
- **Code** (JetBrains Mono 400, 12–13px, 0.04em, uppercase where it is a status word): status codes (MASKS · GATES OPEN EARLY), row times, forecast lead, hour-grid captions at 9.5–10.5px.

### Named Rules
**The Stamped Field Rule.** Mono uppercase is reserved for what a ticket machine would print: field names, times, codes and status words. Headings, prose and buttons are always Mona Sans.

**The Devanagari Rule.** In Hindi, every label, mono and status-code style drops uppercase and tracking and switches to the text face. Body line-height rises to 1.6.

**The Tabular Rule.** Every time, PM2.5 value and count uses tabular figures, so flipping digits never shift sideways.

## Layout

On desktop the map is the full canvas. A 64px top bar fades from 94% Void to transparent and holds the wordmark, the Live/Replay pill group, Layers and the language pill. The ticket docks on the right at 408px wide, running from 76px down to 16px from the bottom, with 16px gutters. The timeline glass bar spans the bottom from 16px to the ticket's left edge (`ticket width + 32px` from the right). Map fits pad around both so the route never sits under glass.

Inside the ticket, padding is 20/24/24px and blocks sit 20px apart on a single fluid column (`minmax(0, 1fr)`), so long labels ellipsize instead of overflowing. The spacing rhythm is 4/8/12/16/20/24px. Status rows and the stub bleed to the ticket edge with a negative margin equal to the padding.

At ≤860px (phone) the map sits on top and the ticket becomes a draggable bottom sheet (90dvh tall, 24px top corners, solid glass). It peeks at 44dvh to show the route block. The timeline floats 8px above the sheet's peek with 8px side gutters and an 18px radius. The top bar shrinks to 56px with the wordmark text hidden. Ticket padding narrows to 18px, the zoom control hides, and the tally shortens. The sticky stub is desktop-only (≥861px), where it keeps the green action in the first viewport.

## Elevation & Depth

There are no drop shadows. Depth comes from glass over the live map: a white film (7% to 3.5% gradient) on 80% Deep Void, `backdrop-filter: blur(20px) saturate(140%)`, and a 1px 10% white edge. Surfaces that must stay opaque over everything (layers popover, bottom sheet, sticky stub) use solid glass on `#0f141b`. Separation inside a surface comes from hairlines and the perforation, not from raised layers. The only ambient light is the violet halo behind the desktop ticket.

### Shadow Vocabulary
- **Pin ring** (`box-shadow: 0 0 0 3px rgba(224, 49, 49, 0.22)`): the FROM pin. The Live dot uses the same ring idea in its green.
- **Thumb ring** (`box-shadow: 0 0 0 1px rgba(255,255,255,0.16)`): the timeline slider thumb, a Snow dot inside a 4px Void border.

### Named Rules
**The Glass-Not-Shadow Rule.** Anything floating over the map is frosted glass with a hairline edge. Never use a drop shadow to lift it.

**The No-Box-In-Box Rule.** Inside the ticket, content is separated by hairline rows and the perforation. The GRAP card is the one bordered inset.

## Shapes

The system uses two shapes. Navigation, tags and status sit in 60px pills: Live/Replay, date tabs, the language toggle, chips and CPCB category pills. Actions are 6px rectangles. Glass objects (ticket, timeline) round to 24px. Inputs use 8px, popovers and messages 14–16px, and hour-strip bars 3px. Round shapes carry meaning: pins and map dots are circles, and the play button is a 44px circle. The ticket's signature form is the perforation, a 1.5px dashed 16% white rule with half-circle Void notches clipped into both card edges. The FROM→TO rail is a 1.5px dashed Sky line joining a filled Ember pin to a hollow Snow ring.

## Components

### Buttons
Rectangular buttons that read like controls rather than marketing.
- **Shape:** gently squared (6px).
- **Primary:** Terminal Green, Snow text, 12% white edge, 44px tall, 15px/500, paired with a lucide icon. One per view, in the stub.
- **Outline (default):** 4% white fill, 16% white edge, 36px tall (44px in the stub row), 14px/500. On hover the fill rises to 9%. Disabled drops to 55% opacity with a progress cursor.
- **Ghost:** no fill or edge, Pearl text, Snow plus a 6% fill on hover ("Back", "Hide the route", Layers).
- **Icon button:** a square outline button (36px, or 44px in the stub) with a 16px icon.
- **Disclosure link ("more"):** bare Sky text with a chevron that rotates 180° when open.
- **Focus:** 2px Sky outline, 2px offset, everywhere.

### Chips
- **Pill group:** a 3px-padded pill track on 60% Void glass. Pills are 32px tall, Pearl at rest. Selected pills take a 10% white fill, Snow text and a Line Strong edge.
- **Suggestion chips:** 30px outline pills, 13.5px Pearl. On hover the text turns Snow and the edge rises to 40% white.
- **CPCB category pill:** a CPCB fill with category ink, 13px/600 name plus a 12px mono value at 85% opacity.

### Cards / Containers
- **Corner Style:** 24px.
- **Background:** glass over the map, solid glass for the sheet and popover.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px Line, or Line Strong on popovers.
- **Internal Padding:** 20/24px for the ticket, 12–18px for the timeline, 14px for the popover.
- **Featured card (GRAP):** 1px Violet border, 7% violet fill, 16px radius, Violet mono heading.

### Inputs / Fields
- **Style:** Obsidian fill, 1px Slate Edge, 8px radius, 44px tall (48px for search), 15–16px text, Mercury placeholder, Sky caret.
- **Focus:** the border turns Sky. There is no glow.
- **Error:** status text in a light coral (`#ff8182`) below the field.
- **Search list:** a `#10151c` popover with a Line Strong edge and 14px radius. The active row gets a 10% Sky wash.

### Navigation
- **Top bar:** a 64px gradient scrim, not a bar. It holds the wordmark (18px/600 plus a 26px mark) and the pill group on the left, with ghost Layers and the language pill on the right. On phones it is 56px with icon-only controls.
- **Timeline:** a glass bar with a 44px circular play button, the current time (15px/600 tabular) plus the mono forecast lead in Sky, and a 4px track with a Sky issue-time marker and mono date ticks. The Snow thumb sits in a Void ring. The tally on the right is a headline figure with Pearl caption.

### The Smoke Ticket (signature)
The ticket stacks, top to bottom:
1. Header: Back plus date pills.
2. FROM / TO rail. Mono labels, 17px values, Pearl notes.
3. ARRIVES block, above a hairline. The 48px time counts in on its left; the CPCB pill and the "N changes" summary sit on its right.
4. Hour-grid strip. CPCB bars, a dashed Snow raw-model line, a 6% Sky band for school hours, and mono hour captions on a 7% white grid.
5. Status list. Each row is a 48px mono time, a 15px name, the mono status code, and a dot plus value. Changed rows set their code in Sky and keep a Sky wash that fades over 1.2s once seen. Changed times flip in place.
6. Remarks. Checkbox rows, with the GRAP featured card first. Completed rows go Mercury with a strikethrough.
7. Parent message and email disclosure.
8. Fine print. 13px Mercury with Sky links.
9. Perforation and stub. One row: the green alerts button, a copy icon button and a WhatsApp outline button. On desktop the stub stays pinned to the bottom of the ticket.

### Map grammar
The basemap is CARTO Dark Matter. Layers stack in this order: the CPCB heat raster, wind ticks (pale blue, 1.2px), smoke trajectories as fading trails, VIIRS fires, stations as hollow pale rings, school dots in CPCB colours, and a white 1px ring on schools above the trigger. The selected route is drawn as a 7.5px Void casing, a 2px 27% Sky base, and a 3.5px Sky line that draws itself. It has an Ember FROM terminus, Ember stop dots, and dated stop labels in 12.5px/600 Snow on a 82% Void plate. Selecting a school dims everything else: heat to 35%, smoke to 6%, schools to about 18%.

### Motion
All motion uses a single expo-out easing (`cubic-bezier(0.16, 1, 0.3, 1)`). The route draws in 1.6s, the arrival time counts in over 0.7s, time flips (rotateX) take 0.28s, ticket content swaps in 0.22s, and the popover opens in 0.18s. Colour and border transitions take 0.2s, the map fit 1.1s, and the lit-row fade 1.2s. Under `prefers-reduced-motion` the route appears complete, numbers land immediately, and every transition and animation collapses to effectively zero.

## Do's and Don'ts

### Do:
- **Do** float every map overlay as glass: white film on 80% Deep Void, blur(20px) saturate(140%), 1px 10% white edge, 24px radius.
- **Do** take every pollution colour from the single CPCB table (`lib/colors.ts`). Use Deep Void ink on all CPCB fills except Severe, which takes Snow.
- **Do** keep exactly one Terminal Green action per view, and keep it in the first viewport.
- **Do** use Sky for the route, links, disclosures and focus, and a Sky wash for "changed and unseen".
- **Do** set times, values and counts in tabular figures, and the arrival time at 48px/425.
- **Do** separate ticket content with hairline rows and the perforation, bleeding rows to the card edge.
- **Do** drop uppercase and tracking on Devanagari labels and use the text face.
- **Do** give every animation a reduced-motion path that lands on the final state.

### Don't:
- **Don't** build the AQI dashboard: no big standalone AQI number, no gauge, no sidebar list of places.
- **Don't** use CPCB colours, or any saturated warm colour, on chrome. Don't invent a custom pollution palette.
- **Don't** add a second green button. Secondary actions are outline or ghost.
- **Don't** use Violet as a fill or a general accent. It belongs to the GRAP featured border and the diffused halo only.
- **Don't** lift surfaces with drop shadows or nest bordered boxes inside the ticket.
- **Don't** set headings, prose or buttons in mono, and don't put mono uppercase labels above headings as decoration.
- **Don't** go neon: no glowing strokes, gradients on text, or saturated dark-mode accents beyond the three signals.
