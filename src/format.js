const integer = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export const formatNumber = (value) => (value == null ? '-' : integer.format(value))
export const formatRating = (value) => (value == null ? '-' : Number(value).toFixed(2))
export const formatClock = (ms) => new Date(ms).toLocaleTimeString()
