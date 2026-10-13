import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../api/endpoints'
import { AuthProvider } from '../features/auth/AuthProvider'
import { ThemeProvider } from '../features/theme/ThemeProvider'
import NavRail from './NavRail'

vi.mock('../api/endpoints')

function renderRail() {
  return render(
    <ThemeProvider>
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/']}>
            <NavRail />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  api.getAuthConfig.mockResolvedValue({ auth_required: true })
  sessionStorage.setItem('trips.token', 'tok')
})

describe('NavRail', () => {
  it('marks the current page and renders each control once', async () => {
    renderRail()
    const link = await screen.findByRole('link', { name: 'Dashboard' })
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('button', { name: /switch to (dark|light) theme/i })).toHaveLength(1)
  })

  it('signs out: clears the token', async () => {
    renderRail()
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Sign out' }))
    expect(sessionStorage.getItem('trips.token')).toBeNull()
  })

  it('has no sign out when the server has auth turned off', async () => {
    api.getAuthConfig.mockResolvedValue({ auth_required: false })
    renderRail()
    await screen.findByRole('link', { name: 'Dashboard' })
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument()
  })
})
