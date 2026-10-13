// The access token lives in sessionStorage: it dies with the tab and is never written to disk.
const KEY = 'trips.token'

function read() {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

/** Reads the exp claim without verifying it. The server stays the authority, this only avoids pointless 401s. */
function expiryOf(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='))).exp ?? null
  } catch {
    return null
  }
}

export function getToken() {
  const token = read()
  if (!token) return null
  const exp = expiryOf(token)
  if (exp && exp * 1000 <= Date.now()) {
    clearToken()
    return null
  }
  return token
}

export function setToken(token) {
  try {
    sessionStorage.setItem(KEY, token)
  } catch {
    /* storage blocked: the session just will not survive a reload */
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}
