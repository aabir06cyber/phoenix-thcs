// Legend categories. Colours match the original dashboard.
export const CATEGORIES = [
  { key: 'wildfire', label: 'Wildfire / Forest Fire', color: '#10B981', hint: 'Forest or rangeland vegetation' },
  { key: 'industrial_fire', label: 'Industrial Fire', color: '#EF4444', hint: 'Near industrial infrastructure' },
  { key: 'persistent_industrial', label: 'Persistent Industrial Activity', color: '#F59E0B', hint: 'Recurring source, 3+ active days' },
  { key: 'mining', label: 'Mining Activity', color: '#3B82F6', hint: 'Near quarry or open-pit site' },
  { key: 'stubble', label: 'Stubble Burning', color: '#8B5CF6', hint: 'Cropland, short-lived' },
  { key: 'uncertain', label: 'Uncertain / Ambiguous Event', color: '#4B5563', hint: 'Insufficient evidence' },
];

const BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

export const PENDING = { key: 'pending', label: 'Analysis pending', color: '#9CA3AF', hint: '' };

/**
 * Map the backend's free-text final_class (+ persistence flag) to a legend category.
 * The backend emits "Industrial Activity" for both one-off and persistent industrial
 * sources, so persistence decides which legend entry it gets.
 */
export function categorize(finalClass, isPersistent) {
  if (!finalClass) return PENDING;
  const c = finalClass.toLowerCase();

  if (/wild|forest/.test(c)) return BY_KEY.wildfire;
  if (/stubble|crop|agri/.test(c)) return BY_KEY.stubble;
  if (/\bmin(e|ing)\b|quarry/.test(c)) return BY_KEY.mining;
  if (/industr|factory|power|refiner/.test(c)) {
    if (/persistent/.test(c)) return BY_KEY.persistent_industrial;
    if (/fire/.test(c)) return BY_KEY.industrial_fire;
    return isPersistent ? BY_KEY.persistent_industrial : BY_KEY.industrial_fire;
  }
  return BY_KEY.uncertain;
}
