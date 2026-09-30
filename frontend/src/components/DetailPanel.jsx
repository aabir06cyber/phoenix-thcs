import { useEffect } from 'react';
import { categorize } from '../lib/classification';
import { fmtNum, fmtPct, fmtTime, nearestInfra } from '../lib/format';

function Cell({ label, children }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-base font-semibold text-gray-900">{children}</div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="truncate text-sm font-medium text-gray-700">{value}</div>
    </div>
  );
}

function RouteBadge({ route }) {
  if (!route) return <span className="text-gray-400">—</span>;
  const fast = route === 'fast';
  return (
    <span
      className={`inline-block rounded px-3 py-1 text-xs font-bold ${
        fast ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {fast ? 'Fast (Stream 1)' : 'Slow (Stream 2 · Qwen2-VL)'}
    </span>
  );
}

export default function DetailPanel({ cluster, loading, error, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!cluster) return null;

  const d = cluster.detail;
  const cat = categorize(cluster.final_class, cluster.is_persistant);
  const pending = (v) => (loading && v == null ? <span className="text-gray-400">Loading…</span> : '—');
  const infra = d ? nearestInfra(d) : null;

  return (
    <div className="absolute bottom-7 left-1/2 z-[1000] max-h-[60%] w-[calc(100%-80px)] max-w-[1300px] -translate-x-1/2 overflow-y-auto rounded-lg border-t-[5px] border-brand bg-white px-8 py-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xl font-bold tracking-tight text-gray-800">Thermal Cluster Diagnostics</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="rounded-full bg-gray-100 p-1.5 text-gray-400 transition-colors hover:text-gray-700"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-5 lg:grid-cols-5">
        <Cell label="Cluster ID">
          <span className="break-all font-mono text-sm">{cluster.cluster_id}</span>
        </Cell>

        <Cell label="Classification">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: cat.color }} />
            {cluster.final_class ?? pending(cluster.final_class)}
          </span>
        </Cell>

        <Cell label="Confidence">
          {cluster.confidence != null ? (
            <div>
              <div className="tabular-nums">
                {Number(cluster.confidence).toFixed(2)}{' '}
                <span className="text-sm font-medium text-gray-500">({fmtPct(cluster.confidence)})</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.min(100, Math.max(0, cluster.confidence * 100))}%` }}
                />
              </div>
            </div>
          ) : (
            pending(cluster.confidence)
          )}
        </Cell>

        <Cell label="Persistent Source">
          {cluster.is_persistant == null ? (
            pending(cluster.is_persistant)
          ) : (
            <span
              className={`inline-block rounded px-3 py-1 text-xs font-bold ${
                cluster.is_persistant ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {cluster.is_persistant ? 'Yes' : 'No'}
            </span>
          )}
        </Cell>

        <Cell label="Cascade Routing">
          {cluster.route ? <RouteBadge route={cluster.route} /> : pending(cluster.route)}
        </Cell>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Supporting evidence</span>
          {error && <span className="text-xs font-medium text-red-600">Could not load full details ({error})</span>}
        </div>
        {d ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
            <Mini label="Centroid" value={`${fmtNum(d.centroid_latitude, 5)}, ${fmtNum(d.centroid_longitude, 5)}`} />
            <Mini label="Detections" value={d.total_detections_in_month} />
            <Mini label="Active days" value={d.active_days_count} />
            <Mini label="Mean / max FRP" value={`${fmtNum(d.mean_frp_mw)} / ${fmtNum(d.max_frp_mw)} MW`} />
            <Mini label="Peak brightness" value={fmtNum(d.max_brightness_kelvin, 1, 'K')} />
            <Mini label="Land cover" value={d.esri_lulc_label ?? '—'} />
            <Mini label="NDVI" value={fmtNum(d.ndvi, 2)} />
            <Mini
              label="Nearest infrastructure"
              value={infra ? `${infra.label} · ${Math.round(infra.dist)} m` : 'None within 5 km'}
            />
            <Mini label="First detected" value={fmtTime(d.first_seen)} />
            <Mini label="Last detected" value={fmtTime(d.last_seen)} />
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {loading ? 'Loading cluster details…' : `Centroid: ${fmtNum(cluster.latitude, 5)}, ${fmtNum(cluster.longitude, 5)}`}
          </p>
        )}
      </div>
    </div>
  );
}
