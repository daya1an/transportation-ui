import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../api/endpoints'
import { ApiError } from '../api/errors'
import { AuthProvider } from '../auth/AuthProvider'
import RequireAuth from '../auth/RequireAuth'
import { ThemeProvider } from '../theme/ThemeProvider'
import LoginPage from './LoginPage'

vi.mock('../api/endpoints')

function renderApp() {
  return render(
    <ThemeProvider>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<RequireAuth><div>Home page</div></RequireAuth>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

async function signIn(user, key) {
  await user.type(await screen.findByLabelText(/access key/i), key)
  await user.click(screen.getByRole('button', { name: /sign in/i }))
}

beforeEach(() => {
  vi.resetAllMocks()
  api.getAuthConfig.mockResolvedValue({ auth_required: true })
})

describe('authentication flow', () => {
  it('sends anonymous visitors to the login page', async () => {
    renderApp()
    expect(await screen.findByText(/enter your access key/i)).toBeInTheDocument()
    expect(screen.queryByText('Home page')).not.toBeInTheDocument()
  })

  it('shows an error for a wrong key and stays on the login page', async () => {
    api.login.mockRejectedValue(new ApiError({ status: 401, code: 'unauthorized', message: 'Invalid access key' }))
    renderApp()
    await signIn(userEvent.setup(), 'wrong-key')
    expect(await screen.findByText(/not correct/i)).toBeInTheDocument()
    expect(screen.queryByText('Home page')).not.toBeInTheDocument()
  })

  it('tells the user how long to wait after a rate limit', async () => {
    api.login.mockRejectedValue(new ApiError({ status: 429, code: 'rate_limited', message: 'Too many requests', retryAfter: 42 }))
    renderApp()
    await signIn(userEvent.setup(), 'whatever')
    expect(await screen.findByText(/try again in 42 seconds/i)).toBeInTheDocument()
  })

  it('stores the token and opens the app after a correct key', async () => {
    api.login.mockResolvedValue({ access_token: 'test-token', token_type: 'bearer', expires_in: 28800 })
    renderApp()
    await signIn(userEvent.setup(), 'right-key')
    expect(await screen.findByText('Home page')).toBeInTheDocument()
    expect(api.login).toHaveBeenCalledWith('right-key')
    expect(sessionStorage.getItem('trips.token')).toBe('test-token')
  })

  it('skips the login page when the server has auth turned off', async () => {
    api.getAuthConfig.mockResolvedValue({ auth_required: false })
    renderApp()
    expect(await screen.findByText('Home page')).toBeInTheDocument()
    expect(api.login).not.toHaveBeenCalled()
  })

  it('offers a retry when the server cannot be reached', async () => {
    api.getAuthConfig
      .mockRejectedValueOnce(new ApiError({ status: 0, code: 'network_error', message: 'Cannot reach the server. Check your connection.' }))
      .mockResolvedValue({ auth_required: false })
    renderApp()
    expect(await screen.findByText(/cannot reach the server/i)).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }))
    await waitFor(() => expect(screen.getByText('Home page')).toBeInTheDocument())
  })
})
