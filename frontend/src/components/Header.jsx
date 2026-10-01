const STATUS_STYLES = {
  ok: { dot: 'bg-emerald-500', text: 'text-emerald-700' },
  warn: { dot: 'bg-amber-500', text: 'text-amber-700' },
  bad: { dot: 'bg-red-500', text: 'text-red-700' },
  idle: { dot: 'bg-gray-400', text: 'text-gray-600' },
};

function Pill({ label, value, tone }) {
  const s = STATUS_STYLES[tone] ?? STATUS_STYLES.idle;
  return (
    <div className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs">
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      <span className="font-medium text-gray-500">{label}</span>
      <span className={`font-semibold ${s.text}`}>{value}</span>
    </div>
  );
}

export default function Header({ apiUp, streamStatus, clusterCount }) {
  const api =
    apiUp === null ? { v: 'Checking', t: 'idle' } : apiUp ? { v: 'Online', t: 'ok' } : { v: 'Unreachable', t: 'bad' };
  const stream =
    streamStatus === 'live'
      ? { v: 'Connected', t: 'ok' }
      : streamStatus === 'reconnecting'
        ? { v: 'Reconnecting', t: 'warn' }
        : { v: 'Connecting', t: 'idle' };

  return (
    <header className="relative z-20 flex h-16 flex-none items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-wider text-brand">PHOENIX</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            Thermal Hotspot Classification System
          </span>
        </div>
        <nav className="hidden h-8 items-center border-l border-gray-200 pl-8 md:flex">
          <span className="text-sm font-semibold text-brand">Dashboard</span>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* New Auto-Sync Schedule Badge */}
        <div className="hidden items-center gap-2 rounded border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs xl:flex">
          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-gray-500">Auto-Sync (IST):</span>
          <span className="font-semibold text-slate-700">04:30, 05:30, 16:30, 17:30</span>
        </div>

        <div className="hidden text-xs font-medium text-gray-500 sm:block">
          <span className="font-bold text-gray-800">{clusterCount}</span> clusters on map
        </div>
        
        <Pill label="API" value={api.v} tone={api.t} />
        <Pill label="Live feed" value={stream.v} tone={stream.t} />
      </div>
    </header>
  );
}
