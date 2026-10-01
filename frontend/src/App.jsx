import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Header from './components/Header';
import Legend from './components/Legend';
import AlertsFeed from './components/AlertsFeed';
import MapView from './components/MapView';
import DetailPanel from './components/DetailPanel';
import { useClusterStream } from './hooks/useClusterStream';
import { checkHealth, fetchCluster, fetchClusterList } from './lib/api';
import { categorize } from './lib/classification';
import { clustersReducer, fromDetail } from './state/clusterStore';
import { HYDRATE_ON_LOAD } from './config';

const MAX_ALERTS = 50;
const HEALTH_POLL_MS = 15000;

export default function App() {
  const [clusters, dispatch] = useReducer(clustersReducer, {});
  const [alerts, setAlerts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detailState, setDetailState] = useState({ loading: false, error: null });
  const [hidden, setHidden] = useState(() => new Set());
  const [flyTarget, setFlyTarget] = useState(null);
  const [apiUp, setApiUp] = useState(null);

  const alertSeq = useRef(0);
  const selectedRef = useRef(null);
  const clustersRef = useRef(clusters);
  clustersRef.current = clusters;

  const pushAlert = useCallback((tone, text, clusterId) => {
    alertSeq.current += 1;
    setAlerts((prev) =>
      [{ id: alertSeq.current, ts: Date.now(), tone, text, clusterId }, ...prev].slice(0, MAX_ALERTS)
    );
  }, []);

  // GET /api/v1.2/clusters/{id}; merges full analysis into the store.
  const loadDetail = useCallback(async (id) => {
    const d = await fetchCluster(id);
    dispatch({ type: 'merge', items: [fromDetail(d)] });
  }, []);

// ---- SSE events -------------------------------------------------------
  const handleEvent = useCallback(
    (evt) => {
      // 1. CATCH INITIAL HYDRATION: If the backend sends the array of 500 clusters
      if (Array.isArray(evt)) {
        dispatch({ type: 'merge', items: evt.map(fromDetail) });
        return;
      }

      // 2. LIVE UPDATES: Handle single events
      const id = evt.cluster_id;
      if (!id) return;

      if (evt.event === 'new_fire_analyzed') {
        dispatch({
          type: 'merge',
          items: [
            { cluster_id: id,
              latitude: evt.latitude,
              longitude: evt.longitude,
              final_class: evt.final_class,
              is_persistant: evt.is_persistant,
              confidence: evt.confidence,
              route: evt.route,},
          ],
        });
        const isInd = categorize(evt.final_class, false).key === 'industrial_fire';
        pushAlert(
          isInd ? 'alert' : 'info',
          `${evt.final_class} classified near [${Number(evt.latitude).toFixed(2)}, ${Number(evt.longitude).toFixed(2)}].`,
          id
        );
        loadDetail(id).catch(() => {});
      } else if (evt.event === 'cluster_updated') {
        dispatch({
          type: 'merge',
          items: [{ cluster_id: id, is_persistant: evt.is_persistant }],
        });
        pushAlert(
          'warn',
          `Persistent thermal source confirmed: ${id} active for ${evt.active_days} days.`,
          id
        );
        loadDetail(id).catch(() => {});
      }
    },
    [pushAlert, loadDetail]
  );

  const streamStatus = useClusterStream(handleEvent);

  // Connection-state alerts (only on transitions).
  const prevStatus = useRef('connecting');
  useEffect(() => {
    const prev = prevStatus.current;
    if (streamStatus === prev) return;
    if (streamStatus === 'live') pushAlert('info', 'Live stream connected.');
    else if (streamStatus === 'reconnecting' && prev === 'live')
      pushAlert('warn', 'Live stream interrupted. Reconnecting…');
    prevStatus.current = streamStatus;
  }, [streamStatus, pushAlert]);

  // ---- API health -------------------------------------------------------
  useEffect(() => {
    const ac = new AbortController();
    const tick = async () => setApiUp(await checkHealth(ac.signal));
    tick();
    const t = setInterval(tick, HEALTH_POLL_MS);
    return () => {
      ac.abort();
      clearInterval(t);
    };
  }, []);

  // ---- Optional: load existing clusters on start ------------------------
  useEffect(() => {
    if (!HYDRATE_ON_LOAD) return;
    const ac = new AbortController();
    fetchClusterList(ac.signal)
      .then((list) => {
        dispatch({ type: 'merge', items: list.map(fromDetail) });
        pushAlert('info', `Loaded ${list.length} existing clusters.`);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') pushAlert('warn', `Could not load existing clusters (${e.message}).`);
      });
    return () => ac.abort();
  }, [pushAlert]);

  // ---- Selection --------------------------------------------------------
  const selectCluster = useCallback(
    async (id, { fly = false } = {}) => {
      selectedRef.current = id;
      setSelectedId(id);
      setDetailState({ loading: true, error: null });

      const known = clustersRef.current[id];
      if (fly && known) setFlyTarget({ lat: known.latitude, lng: known.longitude, nonce: Date.now() });

      try {
        await loadDetail(id);
        if (selectedRef.current === id) setDetailState({ loading: false, error: null });
      } catch (e) {
        if (selectedRef.current === id) setDetailState({ loading: false, error: e.message });
      }
    },
    [loadDetail]
  );

  const closePanel = useCallback(() => {
    selectedRef.current = null;
    setSelectedId(null);
  }, []);

  const toggleCategory = useCallback((key) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  // ---- Derived ----------------------------------------------------------
  const all = useMemo(
    () => Object.values(clusters).filter((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude)),
    [clusters]
  );

  const counts = useMemo(() => {
    const out = {};
    for (const c of all) {
      const k = categorize(c.final_class, c.is_persistant).key;
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }, [all]);

  const visible = useMemo(
    () => all.filter((c) => !hidden.has(categorize(c.final_class, c.is_persistant).key)),
    [all, hidden]
  );

  const selected = selectedId ? clusters[selectedId] : null;

  return (
    <div className="flex h-full flex-col">
      <Header apiUp={apiUp} streamStatus={streamStatus} clusterCount={all.length} />

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <MapView clusters={visible} selectedId={selectedId} onSelect={selectCluster} flyTarget={flyTarget} />
          <DetailPanel
            cluster={selected}
            loading={detailState.loading}
            error={detailState.error}
            onClose={closePanel}
          />
        </div>

        <aside className="z-10 hidden w-[350px] flex-none flex-col bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.05)] lg:flex">
          <Legend counts={counts} hidden={hidden} onToggle={toggleCategory} />
          <AlertsFeed alerts={alerts} onLocate={(id) => selectCluster(id, { fly: true })} />
        </aside>
      </div>
    </div>
  );
}
