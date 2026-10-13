import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from './ThemeProvider'
import ThemeToggle from './ThemeToggle'
import { applyTheme, getInitialTheme, saveTheme } from './theme'

const LIGHT = '/themes/lara-light-blue/theme.css'
const DARK = '/themes/lara-dark-blue/theme.css'

/** Fakes the OS preference. The returned function plays the part of the user changing it. */
function mockSystem(initialDark) {
  const listeners = new Set()
  const query = {
    matches: initialDark,
    media: '',
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
  }
  window.matchMedia = () => query
  return (dark) => {
    query.matches = dark
    listeners.forEach((fn) => fn({ matches: dark }))
  }
}

beforeEach(() => {
  document.head.innerHTML = `<meta name="theme-color" content="#000">
    <link id="theme-link" rel="stylesheet" href="${DARK}" data-light="${LIGHT}" data-dark="${DARK}">`
  mockSystem(false)
})

describe('theme helpers', () => {
  it('follows the system until something is saved', () => {
    mockSystem(true)
    expect(getInitialTheme()).toBe('dark')
    mockSystem(false)
    expect(getInitialTheme()).toBe('light')
    saveTheme('dark')
    expect(getInitialTheme()).toBe('dark') // a saved choice wins over the system
  })

  it('applyTheme swaps the stylesheet, the dark class, color scheme and browser color', () => {
    applyTheme('light')
    expect(document.querySelectorAll('#theme-link')).toHaveLength(1)
    expect(document.getElementById('theme-link').getAttribute('href')).toBe(LIGHT)
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#f4f6fb')

    applyTheme('dark')
    expect(document.getElementById('theme-link').getAttribute('href')).toBe(DARK)
    expect(document.documentElement).toHaveClass('dark')
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#060b16')
  })
})

describe('ThemeToggle', () => {
  it('switches between light and dark and remembers the choice', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    // System is light, so the button offers dark
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(document.getElementById('theme-link').getAttribute('href')).toBe(DARK)
    expect(localStorage.getItem('trips.theme')).toBe('dark')

    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.getElementById('theme-link').getAttribute('href')).toBe(LIGHT)
    expect(localStorage.getItem('trips.theme')).toBe('light')
  })

  it('follows OS changes until the user picks a theme, then ignores them', async () => {
    const user = userEvent.setup()
    const changeSystem = mockSystem(false)
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    act(() => changeSystem(true))
    expect(document.documentElement).toHaveClass('dark')

    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    act(() => changeSystem(true))
    expect(document.documentElement).not.toHaveClass('dark') // the explicit choice sticks
  })
})
