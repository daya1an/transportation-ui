import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { applyTheme, getInitialTheme, getSavedTheme, saveTheme } from './theme'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialTheme)
  const [userChose, setUserChose] = useState(() => getSavedTheme() !== null)

  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  // Follow the operating system until the user picks a theme themselves
  useEffect(() => {
    if (userChose || !window.matchMedia) return undefined
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event) => setMode(event.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [userChose])

  const setTheme = useCallback((next) => {
    saveTheme(next)
    setUserChose(true)
    setMode(next)
  }, [])
  const toggle = useCallback(() => setTheme(mode === 'dark' ? 'light' : 'dark'), [mode, setTheme])

  const value = useMemo(() => ({ mode, setTheme, toggle }), [mode, setTheme, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
