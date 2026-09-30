const trimSlash = (s) => s.replace(/\/+$/, '');

export const API_BASE = trimSlash(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');
const PREFIX = '/api/v1.2/clusters'; // router.py prefix

export const ENDPOINTS = {
  health: `${API_BASE}/health`,                                  // app.py
  cluster: (id) => `${API_BASE}${PREFIX}/${encodeURIComponent(id)}`, // GET /{cluster_id}
  list: `${API_BASE}${PREFIX}/`,                                 // optional, see README notes
  stream: `${API_BASE}${PREFIX}/streaming/streams/sse_update`,   // SSE
};

export const HYDRATE_ON_LOAD = import.meta.env.VITE_HYDRATE_ON_LOAD === 'true';

export const MAP = { center: [22.5, 79.0], zoom: 5, minZoom: 4 };

const style = import.meta.env.VITE_STADIA_STYLE || 'alidade_smooth';
const key = import.meta.env.VITE_STADIA_API_KEY;

export const TILES = {
  url: `https://tiles.stadiamaps.com/tiles/${style}/{z}/{x}/{y}{r}.png${key ? `?api_key=${key}` : ''}`,
  maxZoom: 20,
  attribution:
    '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a>, ' +
    '&copy; <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a>, ' +
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
};
