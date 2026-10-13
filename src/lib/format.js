import { CURRENCY_SYMBOL } from './config'

const integer = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })

export const formatNumber = (value) => (value == null ? '-' : integer.format(value))
/** 14250000 becomes 1.4Cr, 123456 becomes 1.2L (Indian units). */
export const formatCompact = (value) => (value == null ? '-' : compact.format(value))
export const formatCurrency = (value) => (value == null ? '-' : `${CURRENCY_SYMBOL}${integer.format(value)}`)
export const formatCurrencyCompact = (value) => (value == null ? '-' : `${CURRENCY_SYMBOL}${compact.format(value)}`)
export const formatRating = (value) => (value == null ? '-' : Number(value).toFixed(2))
export const formatKm = (value) => (value == null ? '-' : `${Number(value).toFixed(1)} km`)
export const formatPercent = (value) => `${value > 0 ? '+' : ''}${Number(value).toFixed(1)}%`
export const formatClock = (ms) => new Date(ms).toLocaleTimeString()
