// Where the API lives. An empty value means same origin, for reverse proxy setups.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/+$/, '')
