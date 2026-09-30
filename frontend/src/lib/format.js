export const fmtNum = (v, digits = 1, unit = '') =>
  v == null || Number.isNaN(Number(v)) ? '—' : `${Number(v).toFixed(digits)}${unit ? ` ${unit}` : ''}`;

export const fmtPct = (v) => (v == null ? '—' : `${Math.round(Number(v) * 100)}%`);

// Backend datetimes are naive UTC (FIRMS acquisition times); show them in IST.
export function fmtTime(value) {
  if (!value) return '—';
  const s = String(value);
  const iso = /(Z|[+-]\d{2}:\d{2})$/i.test(s) ? s : `${s}Z`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return s;
  return (
    d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) + ' IST'
  );
}

export const fmtClock = (ts) =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

const INFRA = [
  ['dist_to_industrial_m', 'Industrial'],
  ['dist_to_quarry_m', 'Quarry'],
  ['dist_to_power_m', 'Power plant'],
  ['dist_to_factory_m', 'Factory'],
];

export function nearestInfra(detail) {
  let best = null;
  for (const [key, label] of INFRA) {
    const v = detail?.[key];
    if (v != null && (best == null || v < best.dist)) best = { label, dist: v };
  }
  return best;
}
