# Alberta Trout — Fly Fishing PWA

A Progressive Web App for Alberta fly fishers. Shows a Mapbox map centred on Alberta with major trout rivers overlaid, and lets you drop, annotate, and save access point pins backed by Supabase.

## Stack

| Layer | Tech |
|-------|------|
| UI | React 18 + Vite |
| Map | Mapbox GL JS v3 (outdoors style) |
| Backend | Supabase (Postgres + RLS) |
| PWA | vite-plugin-pwa + Workbox |

---

## 1 — Supabase setup (one-time)

1. Open your project's SQL editor:  
   https://supabase.com/dashboard/project/qiibyvfxmswlwjsbjsro/sql/new
2. Paste and run **`supabase/schema.sql`** — this creates the `access_points` table and public RLS policies.

---

## 2 — Local development

```bash
npm install
npm run dev          # http://localhost:5173
```

---

## 3 — Production build

```bash
npm run build        # outputs to dist/
npm run preview      # serve dist/ locally
```

---

## Rivers included

| River | Target species |
|-------|---------------|
| Bow River | Rainbow, Brown |
| Crowsnest River | Brown, Rainbow |
| Oldman River | Brown, Cutthroat |
| Castle River | Cutthroat, Bull Trout |
| Waterton River | Rainbow, Cutthroat |
| Highwood River | Cutthroat, Brown |
| Elbow River | Cutthroat, Brown |
| Ghost River | Cutthroat, Bull Trout |
| Red Deer River | Bull Trout, Whitefish |
| North Saskatchewan River | Bull Trout, Whitefish |
| Livingstone River | Cutthroat, Bull Trout |
| Sheep River | Cutthroat, Brown |
| Raven River | Brown, Rainbow |
| Clearwater River | Bull Trout, Cutthroat |

To add or adjust a river, edit **`src/lib/rivers.js`** — it's a plain GeoJSON FeatureCollection.

---

## Features

- **Map** — Mapbox outdoors style, centred on Alberta at zoom 5
- **River overlay** — 14 Alberta trout rivers as coloured lines with name labels (visible at zoom 7+)
- **Drop pins** — tap anywhere on the map to open the access point form
- **Auto river detection** — if you tap directly on a river line, the river name is pre-filled
- **Notes** — free-text note saved with each pin
- **Sidebar** — scrollable list of all saved access points; tap to fly-to on the map
- **Delete** — remove any access point from the sidebar
- **PWA** — installable on iOS/Android/desktop, offline shell via service worker

---

## Project structure

```
src/
  components/
    Map.jsx          — Mapbox GL JS map, river layers, markers
    PinModal.jsx     — modal form for new access points
    Sidebar.jsx      — access point list panel
  lib/
    supabase.js      — Supabase client
    rivers.js        — Alberta trout rivers GeoJSON
  App.jsx            — state, Supabase calls, layout
  App.css            — all styles
supabase/
  schema.sql         — table + RLS policies
```
