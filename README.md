# FarmCast — Agricultural Weather Intelligence

> Deployed: **[farmcast.vercel.app](https://farmcast.vercel.app)** · Repo: **[github.com/ianMuchesia/farmcast-intelligence](https://github.com/ianMuchesia/farmcast-intelligence)**

---

## The Problem

Over 80% of Kenya's agriculture is rain-fed. That means weather isn't informational — it's existential. A smallholder farmer with 2 acres of avocado trees has no safety net. A wrong call on planting timing or a missed disease window costs an entire season.

The daily operational challenges are real:

- **Crop disease pressure is weather-correlated.** Coffee leaf rust, black sigatoka on bananas, and grey mold on tomatoes all bloom within specific humidity-temperature windows. Farmers without real-time weather data don't know they're in a risk window until they see the symptoms — which is already too late.

- **Extension officers are overwhelmed.** Kenya has roughly 1 agricultural extension officer for every 1,000 farming households. A farmer in Murang'a can't call someone every time the sky looks wrong. They need actionable intelligence on-demand.

- **Orchard health is invisible from the ground.** Avocado, mango, and macadamia exporters — Kenya's fastest-growing agricultural sector — manage canopy health reactively. By the time a diseased tree is visible from the farm road, yield is already lost. Early detection from drone imagery is a solved CV problem that hasn't reached the smallholder.

- **Seasonal patterns are shifting.** The long rains (March–May) and short rains (October–December) that entire farming calendars are built around are no longer reliable. Climate-driven shifts mean decisions that worked for twenty years are now wrong, and farmers have no tool that translates meteorological data into cropping advice.

FarmCast is built around these specific failures. It is not a weather app with a green theme. It is a farm operations dashboard that answers the question a farmer actually asks: _"What should I do today, given this weather?"_

---

## What It Does

### Dashboard (/)

- **Zero-friction location detection** on first load via IP geolocation — no signup, no permission dialog, no pin drop.
- **Current conditions** with agronomically relevant metrics: humidity, wind, precipitation probability, UV index.
- **7-day forecast strip** showing temperature range, precipitation chance, and max wind for each day.
- **Hourly chart** visualizing the next 24 hours as a temperature bar chart with color-coded conditions (clear/cloudy/rain/storm) — density and precision over aesthetics.
- **AI Agronomic Summary** powered by Gemini — not a weather description, but a risk assessment: _"High humidity overnight creates conditions for grey mold in tomato fields. Fungicide application recommended before sunset."_ Returned in English or Swahili.
- **Language toggle** between English and Swahili. The AI summary is regenerated server-side in the selected language.
- **Light/dark theme** that persists across sessions with no flash on load.

### Farm Analysis (/farm-analysis)

- **Drag-and-drop image upload** accepting drone imagery of orchards and tree farms.
- **Computer vision analysis** via WeatherAI's tree detection API: total tree count, canopy coverage %, tree density per acre, and per-tree health classification (healthy / needs care / needs replacement).
- **Visual health bar** showing the ratio of health states across the detected trees.
- **Annotated overlay image** returned alongside the original — the model draws bounding boxes and confidence scores on each tree.
- **Paginated analysis history** — every submission is stored and retrievable, with expandable inline results.

---

## Why This Stack

Every choice was deliberate.

### Next.js 15 App Router + Server-Side API Proxy

The WeatherAI API key must never reach the browser. Beyond security, there's a performance reason: the proxy layer runs a server-side LRU cache with a 10-minute TTL. When 100 users load the Nairobi dashboard simultaneously, they share one upstream call — not 100. This is not a theoretical concern. It's the exact scaling pressure WeatherAI encounters at the API layer daily.

Route Handlers also allow the proxy to enrich responses — stripping internal headers, normalizing the `ai_summary` field (which the API omits entirely on free plans rather than returning null), and forwarding meaningful error shapes to the client.

### Redux Toolkit + RTK Query

RTK Query's subscription model is the right choice for a quota-constrained API. Cache invalidation is automatic — `invalidatesTags: ['TreeAnalyses']` after a POST means the history list refreshes without a manual refetch. `keepUnusedDataFor` is tuned to match the server-side cache TTL (600s for weather, 0s for tree analyses where freshness matters).

`redux-persist` with a selective whitelist (`location`, `ui`) means a field agronomist who loses connectivity mid-session doesn't lose their location or language preference on reload. The quota slice is intentionally excluded from persist — it always re-fetches to get current billing state.

### TypeScript Strict Mode

Agricultural data drives financial decisions. A type error in a temperature conversion or a missing null check on `ai_summary` (which the API omits on free-tier keys) is not a UI bug — it's a wrong recommendation to a farmer. Strict mode with `no-explicit-any` enforced throughout means every field access is verified at compile time.

### Tailwind CSS v4 with CSS Custom Properties

The design system is defined entirely in CSS custom properties in `globals.css` and surfaced as Tailwind utility classes. No hardcoded hex values anywhere in components. This is not aesthetic preference — it means the light/dark theme swap costs zero JavaScript. The browser handles it via `prefers-color-scheme` and a tiny inline script before first paint, eliminating the flash.

---

## Architecture

```
Browser
  └── RTK Query (client cache, 10min TTL)
        └── /api/weather, /api/trees, /api/usage  [Next.js Route Handlers]
              ├── IP Rate Limiter (30 req/hr weather, 10 req/hr tree analysis)
              ├── Server LRU Cache (10min TTL, shared across all users)
              └── api.weather-ai.co/v1  [WeatherAI upstream]
```

### Three-Layer Quota Protection

The WeatherAI API quota is a shared, finite resource. FarmCast protects it at three independent levels:

**1. Server-side IP rate limiting** (`lib/rate-limiter.ts`)
A sliding-window in-memory limiter runs before every upstream call. Weather: 30 req/hr per IP. Tree analysis: 10 req/hr per IP — the CV + Gemini pipeline is expensive and the tighter limit prevents abuse. The store auto-purges expired entries above 10,000 keys to prevent memory growth in long-running processes. Clients receive `429` with a `resetAt` Unix timestamp; the UI formats this as `"Resets at 14:30"`.

**2. Server-side LRU cache** (`lib/weather-cache.ts`)
Successful upstream responses are cached by a compound key of `lat+lon+days+lang+units+ai`. The same location requested by multiple browser sessions shares one cached payload. This is the primary mechanism that keeps per-day API call counts from scaling linearly with user count.

**3. Client-side AI quota guard** (`store/middleware/quotaGuard.ts`)
A Redux middleware watches the `quota.aiRequests` ratio after every `setQuota` dispatch. When remaining AI quota drops below 10%, it sets `aiEnabled = false`. The weather query passes `ai: false` upstream, preventing Gemini calls that would return `402` and burn quota. An `AlertBanner` notifies the user without interrupting the core weather experience.

### Key Files

```
app/
  page.tsx                    — Dashboard (ip=auto detection, RTK Query, skeleton states)
  farm-analysis/page.tsx      — Farm Analysis page
  api/weather/route.ts        — Weather proxy (rate limit + LRU cache + ip=auto)
  api/trees/route.ts          — Tree analysis proxy (rate limit, graceful 403/404)
  api/usage/route.ts          — Usage quota proxy
  globals.css                 — Design tokens (single source of truth for all color)
  layout.tsx                  — DM Serif Display + DM Sans + DM Mono font loading

components/
  weather/                    — WeatherHero, ForecastStrip, HourlyChart, AISummaryCard
  trees/                      — ImageUploader, AnalysisResult, AnalysisHistory, TreeHealthBar
  layout/                     — Navbar (theme + language toggles), AlertBanner, PageWrapper
  search/                     — LocationSearch (Nominatim geocoding + history)
  quota/                      — QuotaStatusBar

store/
  api/weatherApi.ts           — RTK Query endpoints (weather, usage, trees)
  slices/                     — locationSlice, quotaSlice, uiSlice
  middleware/quotaGuard.ts    — AI quota auto-disable middleware

lib/
  weather-cache.ts            — LRU cache singleton
  rate-limiter.ts             — IP sliding-window rate limiter
  get-client-ip.ts            — x-forwarded-for → x-real-ip → 127.0.0.1
  condition-map.ts            — WMO code → icon + label + severity
  retry.ts                    — Exponential backoff for upstream calls
```

---

## Setup

### Prerequisites

- Node.js 20+
- Yarn 4 (the project uses Yarn's `node-modules` linker)
- A WeatherAI API key from [weather-ai.co/docs](https://weather-ai.co/docs)

### Install

```bash
git clone https://github.com/you/farmcast
cd farmcast
cp .env.example .env.local
```

Edit `.env.local`:

```env
WEATHERAI_API_KEY=wai_your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

The dashboard auto-detects your location from the server-side request IP on first load. No manual setup required.

### Build for Production

```bash
yarn build
yarn start
```

---

## Design System

The aesthetic is **precision instruments, not a consumer app**. Think field terminals and soil science reports.

| Token class    | Usage                                                           |
| -------------- | --------------------------------------------------------------- |
| `font-display` | DM Serif Display — hero temperatures, page headings             |
| `font-mono`    | DM Mono — all numeric values, ALL-CAPS labels, badges           |
| `font-body`    | DM Sans — prose, UI descriptions, form labels                   |
| `bg-primary`   | Deep forest green — primary actions, today's forecast highlight |
| `bg-secondary` | Harvest amber — AI section, warnings, needs-care health state   |
| `bg-accent`    | Alert red — danger alerts, replacement-needed health state      |

Zero gradients. Zero rounded pill buttons. Flat, deliberate color.

---

## Known Constraints

- **Tree analysis history** returns an empty list on the free WeatherAI plan. The `/v1/trees/analyses` endpoint is a Pro+ feature. The UI shows an appropriate empty state rather than an error.
- **AI summaries** are absent on the free plan (`x-ai-allow: false`). FarmCast detects this and shows a clear "AI summary unavailable" state rather than crashing.
- **Rate limiting is in-process** — if you deploy multiple server instances, the rate limiter state is not shared. For production scale, replace `lib/rate-limiter.ts` with a Redis-backed implementation.
- **Nominatim geocoding** (OpenStreetMap) is used for location search. It is free but rate-limited at 1 req/s. For production, swap with a paid geocoding API.

---

## Stack

|              |                                    |
| ------------ | ---------------------------------- |
| Framework    | Next.js 16 (App Router)            |
| Language     | TypeScript 5 (strict)              |
| State        | Redux Toolkit 2 + RTK Query        |
| Persistence  | redux-persist                      |
| Styling      | Tailwind CSS v4                    |
| Icons        | lucide-react                       |
| Dates        | date-fns                           |
| Geocoding    | Nominatim (OpenStreetMap)          |
| External API | [WeatherAI](https://weather-ai.co) |
