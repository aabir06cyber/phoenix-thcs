<div align="center">

<img src="logo_fb.png" alt="Team FireBenders" width="120"/>

# Phoenix — Thermal Hotspot Classification System (THCS)

**AI-based detection and classification of industrial fires and persistent thermal sources.**
MVP for Smart India Hackathon 2026 · Problem Statement **SIH26162** · Team **FireBenders**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/frontend-React%20%2B%20Leaflet-61dafb)](https://react.dev/)
[![Modal](https://img.shields.io/badge/GPU-Modal%20T4-7fee64)](https://modal.com/)
[![Live](https://img.shields.io/badge/live-phoenix--thcs.online-orange)](https://phoenix-thcs.online)

</div>

---

## Table of contents

- [The problem](#the-problem)
- [How Phoenix works](#how-phoenix-works)
- [Architecture](#architecture)
- [Classification engine](#classification-engine)
- [Dashboard](#dashboard)
- [Data model](#data-model)
- [API](#api)
- [Getting started](#getting-started)
- [Deployment](#deployment)
- [Tech stack](#tech-stack)
- [Limitations and roadmap](#limitations-and-roadmap)

---

## The problem

Satellite thermal alerts (NASA FIRMS / VIIRS) flag *every* hot pixel. A stubble fire, a forest fire, a steel-plant furnace and a quarry blast all look the same in the raw feed, and an operator watching India sees thousands of dots a day with no way to tell which ones matter.

Phoenix turns that raw feed into **labelled, explainable events**. It separates *episodic fires* from *persistent industrial heat sources* and tells you, for each hotspot, what it most likely is, how confident the system is, and why.

---

## How Phoenix works

Phoenix runs autonomously. Here is the life of a hotspot, from satellite pass to pin on the map.

```mermaid
sequenceDiagram
    autonumber
    participant S as APScheduler
    participant B as FastAPI backend
    participant F as NASA FIRMS
    participant D as PostgreSQL + PostGIS
    participant G as Earth Engine
    participant M as Modal GPU worker
    participant U as Dashboard (browser)

    S->>B: Trigger run (IST overpass window)
    B->>F: Fetch new VIIRS detections (NOAA-20 + NOAA-21)
    B->>B: DBSCAN groups detections into clusters
    loop each cluster
        B->>D: Seen within 1.5 km in last 14 days?
        alt Recurring
            D-->>B: Existing cluster
            B->>D: Update active days / FRP (skip ML)
            B-->>U: SSE cluster_updated (if now persistent)
        else New
            B->>D: Infrastructure distances (PostGIS)
            B->>G: Land cover + NDVI
            B->>M: evaluate(cluster)
            M->>G: Sentinel-2 crop
            M-->>B: Verdict (class, confidence, route)
            B->>D: Store cluster + analysis
            B-->>U: SSE new_fire_analyzed
        end
    end
```

In plain terms:

1. **Poll.** At the NOAA-20/21 overpass windows (plus the ~4 h near-real-time delay), the backend pulls fresh VIIRS fire detections over India.
2. **Cluster.** Nearby detections are merged with **DBSCAN** into hotspot clusters, so one fire is one object rather than dozens of pixels.
3. **Recall.** Each cluster is checked against the last 14 days within 1.5 km. If the location is already tracked, Phoenix just updates its history. A hotspot that keeps reappearing for **3+ days** is promoted to a *persistent source*, with no ML cost.
4. **Enrich.** New clusters get context: distance to factories, power plants, quarries and industrial zones (PostGIS joins on OSM polygons), land-cover class (ESRI LULC) and vegetation index (Sentinel-2 NDVI).
5. **Classify.** The cluster goes to a GPU worker running a two-stream, fast/slow cascade (see [Classification engine](#classification-engine)). Easy cases are accepted immediately; ambiguous ones are resolved by a vision-language model.
6. **Store and push.** The verdict is written to the database and broadcast over **Server-Sent Events**. Every open dashboard updates instantly, with no refresh and no polling for data.

---

## Architecture

<p align="center">
  <img src="docs/technical-approach.png" alt="Phoenix technical approach diagram" width="900"/>
</p>

Phoenix is split into four layers, each with one job.

| Layer | Responsibility | Built with |
| --- | --- | --- |
| **Data sources** | Thermal detections, infrastructure, land cover, optical imagery | NASA FIRMS, OpenStreetMap, ESRI LULC 10 m, Sentinel-2 (via Google Earth Engine) |
| **Processing & ML** | Clustering, feature engineering, hypothesis rules, vision scoring, VLM resolver | scikit-learn, RemoteCLIP, Qwen2-VL-2B, Modal (T4 GPU) |
| **Storage & API** | Historical store, spatial queries, persistence tracking, REST + SSE | FastAPI, PostgreSQL + PostGIS (GIST indexes), SQLAlchemy |
| **Client** | Live map, filters, alerts, cluster diagnostics | React, Leaflet, Tailwind |

```mermaid
flowchart LR
    subgraph SRC[Data sources]
        FIRMS[NASA FIRMS<br/>VIIRS NOAA-20/21 NRT]
        OSM[OpenStreetMap<br/>infrastructure polygons]
        GEE[Google Earth Engine<br/>ESRI LULC, Sentinel-2]
    end

    subgraph API[FastAPI backend]
        SCH[APScheduler] --> RUN[Pipeline run]
        RUN --> CL[DBSCAN]
        CL --> REC{Recurring?}
        REC -- no --> ENR[Feature enrichment]
    end

    subgraph ML[Modal worker - T4 GPU]
        S1[Stream 1<br/>spatial rules] --> FUSE[RemoteCLIP<br/>quality-weighted fusion]
        FUSE --> LANE{Confident<br/>and agreeing?}
        LANE -- yes --> FAST[Fast lane]
        LANE -- no --> SLOW[Slow lane<br/>Qwen2-VL-2B]
    end

    DB[(PostgreSQL + PostGIS)]
    UI[React + Leaflet dashboard]

    FIRMS --> RUN
    OSM --> DB
    GEE --> ENR
    REC <--> DB
    ENR --> S1
    FAST --> API
    SLOW --> API
    API <--> DB
    API -- REST + SSE --> UI
```

### Key design decisions

- **GPU work is isolated.** The API never imports `torch`. All model inference lives in `modal_app.py` and is called remotely, so the backend stays small and cheap to host and the GPU scales independently.
- **Cheap path first.** A rule engine over spatial context makes the first call. The vision model only *verifies* it, and the heavy VLM only runs when the two disagree or confidence is low.
- **Recurrence is memory, not ML.** A PostGIS radius lookup recognises known locations, which is what makes persistent-source detection fast and cheap.
- **Image quality is a first-class signal.** Cloud cover and blur reduce how much the visual stream is trusted. Unusable imagery falls back to spatial reasoning instead of producing a confident wrong answer.
- **Never drop a cluster.** If Modal is unreachable, the cluster is still stored as `Uncertain / Ambiguous Event` with `confidence = 0.0`, so failures are easy to find and re-classify.
- **Push, not poll.** SSE delivers a snapshot on connect and live events afterwards, and the browser's `EventSource` handles reconnects.

---

## Classification engine

Implemented in `engine.py` and executed on Modal.

### 1. Persistence test

A cluster is a **persistent source** when it is *recurrent* (`active_days ≥ 3`) **and** either *dense* (`detections ÷ active_days ≥ 2`) or *intense* (`brightness ≥ 366 K` or `FRP ≥ 15 MW`). This is what separates a furnace that burns every day from a one-off fire.

### 2. Stream 1: spatial hypothesis

Rules over infrastructure proximity (within 1 km), land cover, NDVI, FRP and duration produce a candidate class and a spatial confidence `S_spatial`.

| Condition | Hypothesis | `S_spatial` |
| --- | --- | --- |
| Persistent and near mapped infrastructure | Class of the nearest infrastructure type | 0.85 |
| Persistent, no nearby infrastructure | Industrial Activity | 0.75 |
| Not persistent, near infrastructure | Class of the nearest infrastructure type | 0.78 |
| Cropland and short-lived (≤ 2 active days, ≤ 48 h) | Stubble Burning | 0.72–0.88, higher when NDVI ≤ 0.35 |
| Forest, rangeland or flooded vegetation | Wildfire / Forest Fire | 0.68–0.85, higher when NDVI ≥ 0.40 |
| Cropland, otherwise | Stubble Burning | 0.60 |
| None of the above | Uncertain / Ambiguous Event | 0.50 |

Quarries map to *Mining Activity*; power plants, factories and industrial zones map to *Industrial Activity*.

### 3. Stream 2: visual verification

An adaptively sized, 512 px Sentinel-2 RGB crop is fetched around the cluster (sized from the VIIRS pixel footprint plus geolocation uncertainty, and widened when infrastructure is close). **RemoteCLIP (ViT-B/32)** scores the image zero-shot against a text prompt for the Stream 1 hypothesis, and also finds its own top class across all categories. An image-quality score `Q_img` combines cloud cover and a sharpness metric.

### 4. Quality-weighted fusion

```
w       = 0.40 × Q_img
C_final = (1 − w) × S_spatial + w × S_visual
```

Cloudy or blurry imagery lowers `w` automatically. If `Q_img < 0.15` the image is ignored and spatial confidence is used alone.

### 5. Fast / slow cascade

| Lane | When | What happens |
| --- | --- | --- |
| **Fast** | Streams agree **and** `C_final ≥ 0.75` | Verdict accepted automatically, no LLM call |
| **Slow** | Streams disagree, or confidence is low | **Qwen2-VL-2B-Instruct** (4-bit) receives the image and all signals and returns a JSON verdict with a one-line reasoning |

If imagery is unavailable the spatial verdict is returned directly, and if Qwen cannot load the slow lane falls back to the fast verdict.

### Output

Each verdict contains `final_class`, `confidence` (0–1), `is_persistent_source`, `route` (`fast` or `slow`) and optional `reasoning`.

---

## Dashboard

A React single-page app in [`frontend/`](frontend/), designed to be plain, readable and presentation-friendly: a colour-coded map, a legend that doubles as a filter, and click-for-details on every cluster.

### Classification legend

| Colour | Category | Meaning |
| --- | --- | --- |
| 🟢 `#10B981` | Wildfire / Forest Fire | Forest or rangeland vegetation |
| 🔴 `#EF4444` | Industrial Fire | Episodic fire near industrial infrastructure |
| 🟠 `#F59E0B` | Persistent Industrial Activity | Recurring source, 3+ active days |
| 🔵 `#3B82F6` | Mining Activity | Near quarry or open-pit site |
| 🟣 `#8B5CF6` | Stubble Burning | Cropland, short-lived |
| ⚫ `#4B5563` | Uncertain / Ambiguous Event | Insufficient evidence |

The backend emits `Industrial Activity` for both one-off and persistent industrial sources, so the dashboard uses the persistence flag to choose between *Industrial Fire* and *Persistent Industrial Activity*.

### Features

- **Live map.** Leaflet map of India with a boundary overlay and one colour-coded marker per cluster. Hover for the cluster ID, click to inspect.
- **Real-time stream.** Subscribes to the backend SSE feed: an initial snapshot of up to 500 analysed clusters, then `new_fire_analyzed` and `cluster_updated` events merged into state as they arrive. Connection state (connecting, live, reconnecting) is always visible.
- **Legend as filter.** Click a category to hide or show it. Live per-category counts.
- **System alerts.** Newest-first feed (last 50) of new classifications, persistent-source confirmations and connection changes. Click an alert to fly to its cluster.
- **Cluster diagnostics.** Classification, confidence bar, persistence flag, cascade route (*Fast* or *Slow · Qwen2-VL*) and supporting evidence: centroid, detections, active days, mean/max FRP, peak brightness, land cover, NDVI, nearest infrastructure and first/last detection time in IST. `Esc` closes the panel.
- **Status header.** API health (polled every 15 s), stream status, cluster count and the backend auto-sync schedule.

### How the UI consumes data

1. On load, `useClusterStream` opens an `EventSource` to the SSE endpoint. The first message is an array of clusters; each is normalised by `fromDetail` and merged into a reducer-managed store.
2. Live events carry just enough to place a marker and raise an alert. The app then calls `GET /clusters/{id}` to fill in the full evidence panel.
3. The store merges partial updates and never overwrites a field with `null`, so a sparse event cannot erase richer data.
4. Optionally (`VITE_HYDRATE_ON_LOAD=true`) the app also fetches `GET /clusters/` on start.

### Structure

```
frontend/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                   # Entry point
    ├── App.jsx                    # State, SSE event handling, selection
    ├── config.js                  # API base URL, endpoints, map and tile settings
    ├── components/
    │   ├── Header.jsx             # Branding, API / stream status, sync schedule
    │   ├── MapView.jsx            # react-leaflet map and markers
    │   ├── Legend.jsx             # Category legend and filter
    │   ├── AlertsFeed.jsx         # System alerts
    │   └── DetailPanel.jsx        # Cluster diagnostics
    ├── hooks/useClusterStream.js  # SSE subscription
    ├── lib/                       # api, classification, format helpers
    ├── state/clusterStore.js      # Cluster reducer
    └── data/india-boundary.json
```

---

## Data model

| Table | Purpose | Key fields |
| --- | --- | --- |
| `clusters` | One row per hotspot cluster | `cluster_id`, centroid lat/lon, `total_detections_in_month`, `active_days_count`, `mean_frp_mw`, `max_frp_mw`, `max_brightness_kelvin`, `first_seen`, `last_seen`, `dist_to_{industrial,quarry,power,factory}_m`, `is_near_*`, `esri_lulc_code`, `esri_lulc_label`, `ndvi` |
| `analysis_history` | Classifier verdict per cluster | `cluster_id`, `final_class`, `confidence`, `is_persistant`, `route` |
| `infrastructure_polygons` | OSM-derived industrial footprint | `type` (`industrial`, `quarry`, `power`, `factory`), `geom` (GIST-indexed) |

Cluster IDs look like `CLST_YYYYMMDDHhh_N20_0000`. FIRMS timestamps are stored as naive UTC and displayed in IST by the dashboard.

---

## API

Base path: `/api/v1.2/clusters`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Liveness check |
| `GET` | `/api/v1.2/clusters/` | List clusters with analysis, newest first (`?limit=500`) |
| `GET` | `/api/v1.2/clusters/{cluster_id}` | One cluster with its analysis |
| `POST` | `/api/v1.2/clusters/` | Insert a cluster and trigger a background pipeline run |
| `GET` | `/api/v1.2/clusters/streaming/streams/sse_update` | SSE: initial snapshot, then live events |

**SSE events**

- `new_fire_analyzed`: a new cluster was classified (class, confidence, route, coordinates).
- `cluster_updated`: an existing cluster became a persistent source after 3+ active days.

Swagger UI is available at `/docs` when the backend is running.

**Scheduling.** The pipeline runs at **04:30, 05:30, 16:30 and 17:30 IST**, aligned to NOAA-20/21 overpasses plus the NRT delay. Runs never overlap, missed triggers coalesce into one, and a 15-minute misfire grace window applies.

---

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 20.19+ (required by Vite 8)
- PostgreSQL with the **PostGIS** extension (Supabase works)
- A [NASA FIRMS MAP_KEY](https://firms.modaps.eosdis.nasa.gov/api/map_key/)
- A Google Earth Engine project and service account
- A [Modal](https://modal.com) account
- A [Stadia Maps](https://stadiamaps.com) account for basemap tiles

### 1. Backend

```bash
git clone https://github.com/aabir06cyber/phoenix-thcs.git
cd phoenix-thcs
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` in the project root:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
FIRMS_MAP_KEY=your_firms_map_key
GEE_PROJECT=your-earth-engine-project-id
GEE_SERVICE_ACCOUNT_JSON={"type":"service_account", ...}   # optional locally
JWT_ACCESS_KEY=change-me
ALGORITHM=HS256
```

If `GEE_SERVICE_ACCOUNT_JSON` is unset, the backend uses local credentials from `earthengine authenticate`.

Enable PostGIS and load `infrastructure_polygons` from OSM GeoJSON (factories/works, quarries, power plants).

### 2. ML worker (Modal)

```bash
pip install modal
modal setup

# Modal dashboard -> Secrets -> Create -> Custom, name it "phoenix-gee"
#   GEE_SERVICE_ACCOUNT_JSON = <entire service-account key file>
#   GEE_PROJECT              = <your Earth Engine project id>

modal deploy modal_app.py
modal run modal_app.py        # optional smoke test; first run downloads ~5 GB of weights
```

The app name `phoenix-ml` and class `Evaluator` must match `MODAL_APP_NAME` and `MODAL_CLASS_NAME` in `router.py`.

### 3. Run the API

```bash
uvicorn app:app --reload
```

Check <http://localhost:8000/health> and <http://localhost:8000/docs>.

### 4. Dashboard

```bash
cd frontend
cp .env.example .env      # then edit
npm install
npm run dev               # http://localhost:5173
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `https://api.phoenix-thcs.online` | Backend URL. Use `http://localhost:8000` for local development |
| `VITE_HYDRATE_ON_LOAD` | `false` | Also fetch the existing cluster list on startup |
| `VITE_STADIA_STYLE` | `alidade_smooth` | Stadia Maps basemap style |
| `VITE_STADIA_API_KEY` | _(none)_ | Optional; leave empty when using domain authentication |

Basemap tiles come from Stadia Maps. With domain authentication, add your dev (`localhost`) and production domains in the Stadia dashboard instead of shipping an API key.

---

## Deployment

- **Backend:** any Procfile-based host (e.g. Railway). Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`. Set the environment variables above, plus Modal credentials (`MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`) so it can call the worker.
- **ML worker:** Modal. Single T4 container with a 5-minute warm window, Hugging Face weights cached in the `phoenix-hf-cache` volume.
- **Dashboard:** `npm run build` in `frontend/` produces a static bundle for any static host. Set `VITE_API_BASE_URL` at build time.
- **Live:** <https://phoenix-thcs.online>

---

## Tech stack

| Layer | Technology |
| --- | --- |
| API | Python, FastAPI, Uvicorn, Pydantic v2, APScheduler |
| Data | PostgreSQL + PostGIS (GIST-indexed), SQLAlchemy (async), asyncpg |
| Geospatial | NASA FIRMS (VIIRS), Google Earth Engine, Sentinel-2, ESRI LULC, OpenStreetMap |
| Clustering | scikit-learn DBSCAN |
| ML | RemoteCLIP (open_clip), Qwen2-VL-2B-Instruct (Transformers, bitsandbytes), PyTorch |
| Compute | Modal (T4 GPU) |
| Frontend | React 18, Vite, Tailwind CSS 4, Leaflet / react-leaflet, Server-Sent Events, Stadia Maps |

---

## Limitations and roadmap

- VIIRS pixels are 375 m, so very small or short-lived heat sources can be missed or merged.
- Sentinel-2 imagery depends on cloud cover. Poor scenes shift weight to the spatial stream.
- Infrastructure proximity depends on OSM completeness.
- Classification time is dominated by imagery fetch and GPU cold starts. The cascade exists to keep most clusters on the fast lane.
- Planned: integrate ISRO **EOS-05** data for NDVI / NBR.
- This is a hackathon MVP, not a certified emergency-response system.

---

## Team

**Team FireBenders**, SIH 2026, PS ID 26162

---

## License

Released under the [MIT License](LICENSE). © 2026 Aabir Bhattacharya.