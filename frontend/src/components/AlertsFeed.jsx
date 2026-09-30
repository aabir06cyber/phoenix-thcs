import { fmtClock } from '../lib/format';

const TONES = {
  info: 'border-gray-200 border-l-gray-400',
  warn: 'border-orange-200 border-l-orange-500',
  alert: 'border-red-200 border-l-red-500',
};

export default function AlertsFeed({ alerts, onLocate }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-gray-50/60 p-6">
      <h2 className="mb-4 flex items-center text-xs font-bold uppercase tracking-wider text-brand">
        <svg className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          />
        </svg>
        System Alerts
      </h2>

      {alerts.length === 0 ? (
        <p className="text-sm text-gray-500">Waiting for live detections…</p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {alerts.map((a) => {
            const clickable = Boolean(a.clusterId);
            const Tag = clickable ? 'button' : 'div';
            return (
              <li key={a.id}>
                <Tag
                  {...(clickable ? { type: 'button', onClick: () => onLocate(a.clusterId) } : {})}
                  className={`block w-full rounded border border-l-4 bg-white p-3.5 text-left shadow-sm ${TONES[a.tone] ?? TONES.info} ${
                    clickable ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
                  }`}
                >
                  <span className="block text-[11px] font-semibold tabular-nums text-gray-400">{fmtClock(a.ts)}</span>
                  <span className="block text-sm font-semibold leading-snug text-gray-800">{a.text}</span>
                </Tag>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
