/** Keeps the biggest `max` slices and folds the rest into one "Other" slice, so the panel stays readable. */
export function groupMix(items, max = 6) {
  if (items.length <= max + 1) return items
  const head = items.slice(0, max)
  const rest = items.slice(max)
  const sum = (key) => rest.reduce((total, item) => total + item[key], 0)
  return [
    ...head,
    {
      label: `Other (${rest.length})`,
      sales: sum('sales'),
      trips: sum('trips'),
      share_pct: Math.round(sum('share_pct') * 100) / 100,
      isOther: true,
    },
  ]
}
