// Where the API lives. An empty value means same origin, for reverse proxy setups.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/+$/, '')

// Shown in front of sales amounts. Set VITE_CURRENCY_SYMBOL to change it, or to an empty string for none.
export const CURRENCY_SYMBOL = import.meta.env.VITE_CURRENCY_SYMBOL ?? '₹'
