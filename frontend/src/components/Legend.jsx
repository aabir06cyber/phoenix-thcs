import { CATEGORIES } from '../lib/classification';

export default function Legend({ counts, hidden, onToggle }) {
  return (
    <section className="flex-none border-b border-gray-100 p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Classification Legend</h2>
        <span className="text-[11px] text-gray-400">Click to show / hide</span>
      </div>
      <ul className="space-y-1">
        {CATEGORIES.map((c) => {
          const off = hidden.has(c.key);
          return (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => onToggle(c.key)}
                aria-pressed={!off}
                className="flex w-full items-center gap-3 rounded px-2 py-2 text-left transition-colors hover:bg-gray-50"
              >
                <span
                  className="h-3.5 w-3.5 flex-none rounded-full border-2"
                  style={{ borderColor: c.color, backgroundColor: off ? 'transparent' : c.color }}
                />
                <span className={`min-w-0 flex-1 ${off ? 'opacity-40' : ''}`}>
                  <span className="block text-sm font-medium text-gray-800">{c.label}</span>
                  <span className="block text-[11px] text-gray-500">{c.hint}</span>
                </span>
                <span className={`text-sm font-semibold tabular-nums text-gray-700 ${off ? 'opacity-40' : ''}`}>
                  {counts[c.key] ?? 0}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
