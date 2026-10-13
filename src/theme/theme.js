// Framework-free theme helpers. The inline script in index.html applies the same rules before first paint.
export const THEME_KEY = 'trips.theme'
const META_COLORS = { dark: '#060b16', light: '#f4f6fb' }

export function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function getSavedTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    return null
  }
}

export function saveTheme(mode) {
  try {
    localStorage.setItem(THEME_KEY, mode)
  } catch {
    /* storage blocked: the choice just will not survive a reload */
  }
}

/** A saved choice wins, otherwise follow the operating system. */
export function getInitialTheme() {
  return getSavedTheme() ?? (systemPrefersDark() ? 'dark' : 'light')
}

/** Loads the new stylesheet first and only then removes the old one, so there is no unstyled flash. */
function swapThemeStylesheet(href) {
  const current = document.getElementById('theme-link')
  if (!current || current.getAttribute('href') === href) return
  const next = current.cloneNode()
  next.setAttribute('href', href)
  current.removeAttribute('id')
  next.id = 'theme-link'
  const dropOld = () => current.remove()
  next.onload = dropOld
  next.onerror = dropOld
  current.after(next) // later in the document, so it wins any tie until the old one is gone
}

export function applyTheme(mode) {
  const href = document.getElementById('theme-link')?.dataset[mode]
  if (href) swapThemeStylesheet(href)
  const root = document.documentElement
  root.classList.toggle('dark', mode === 'dark')
  root.style.colorScheme = mode
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[mode])
}
