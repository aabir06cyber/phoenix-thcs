# Phoenix Dashboard (React + Vite + Leaflet + Stadia Maps)

```bash
npm install
cp .env.example .env     # set VITE_API_BASE_URL if the backend isn't on :8000
npm run dev              # http://localhost:5173
```

Backend endpoints used (see router.py / app.py):

| Purpose | Endpoint |
| --- | --- |
| Live updates (SSE) | `GET /api/v1.2/clusters/streaming/streams/sse_update` |
| Cluster details on click | `GET /api/v1.2/clusters/{cluster_id}` |
| API status pill | `GET /health` |
| Optional: load existing clusters on start | `GET /api/v1.2/clusters/` (not in router.py yet; see notes) |

Stadia Maps: localhost works with no key. For a deployed site, add its domain in the Stadia
dashboard (domain auth), or set `VITE_STADIA_API_KEY`.
