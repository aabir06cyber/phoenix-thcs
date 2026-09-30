// Flat map of cluster_id -> cluster. Partial updates are merged; null/undefined never overwrite.
export function clustersReducer(state, action) {
  if (action.type !== 'merge') return state;
  const next = { ...state };
  for (const item of action.items) {
    const clean = Object.fromEntries(Object.entries(item).filter(([, v]) => v != null));
    next[item.cluster_id] = { ...next[item.cluster_id], ...clean };
  }
  return next;
}

/** ClusterModel (GET /{cluster_id}) -> marker/store shape */
export function fromDetail(d) {
  return {
    cluster_id: d.cluster_id,
    latitude: d.centroid_latitude,
    longitude: d.centroid_longitude,
    final_class: d.analysis_bp?.final_class,
    confidence: d.analysis_bp?.confidence,
    is_persistant: d.analysis_bp?.is_persistant,
    route: d.analysis_bp?.route,
    detail: d,
  };
}
