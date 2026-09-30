import { ENDPOINTS } from '../config';

async function getJson(url, signal) {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/** GET /api/v1.2/clusters/{cluster_id} -> ClusterModel (with analysis_bp) */
export const fetchCluster = (id, signal) => getJson(ENDPOINTS.cluster(id), signal);

/** GET /api/v1.2/clusters/ -> ClusterModel[]  (only if you add the list endpoint) */
export const fetchClusterList = (signal) => getJson(ENDPOINTS.list, signal);

/** GET /health */
export async function checkHealth(signal) {
  try {
    const res = await fetch(ENDPOINTS.health, { signal });
    return res.ok;
  } catch {
    return false;
  }
}
