// Series colors per theme. Lighter hues on dark backgrounds, deeper ones on light, so contrast holds in both.
const PALETTES = {
  dark: ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c', '#22d3ee', '#a3e635'],
  light: ['#2563eb', '#059669', '#d97706', '#db2777', '#7c3aed', '#ea580c', '#0891b2', '#65a30d'],
}
export const OTHER_COLOR = { dark: '#64748b', light: '#94a3b8' }

export const paletteFor = (mode) => PALETTES[mode] ?? PALETTES.dark
export const colorAt = (mode, index) => paletteFor(mode)[index % paletteFor(mode).length]
