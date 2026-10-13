import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { Password } from 'primereact/password'
import { useAuth } from './AuthProvider'
import { FullScreenSpinner } from './RequireAuth'
import ThemeToggle from '../theme/ThemeToggle'

function describe(error) {
  if (error.status === 401) return 'That access key is not correct.'
  if (error.status === 429) return `Too many attempts. Try again in ${error.retryAfter ?? 60} seconds.`
  return error.message || 'Sign in failed.'
}

export default function LoginPage() {
  const { loading, isAuthenticated, sessionExpired, login } = useAuth()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/'
  const [accessKey, setAccessKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (loading) return <FullScreenSpinner />
  if (isAuthenticated) return <Navigate to={from} replace />

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(accessKey) // success flips isAuthenticated, which redirects above
    } catch (err) {
      setError(describe(err))
      setBusy(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-line bg-card p-6 shadow-lg">
        <div className="space-y-1 text-center">
          <i className="pi pi-chart-bar text-3xl text-accent" />
          <h1 className="text-xl font-semibold text-fg">Trips dashboard</h1>
          <p className="text-sm text-muted">Enter your access key to continue.</p>
        </div>

        {sessionExpired && <Message severity="info" text="Your session expired. Please sign in again." className="w-full" />}
        {error && <Message severity="error" text={error} className="w-full" />}

        <div className="flex flex-col gap-2">
          <label htmlFor="access-key" className="text-sm font-medium text-fg">
            Access key
          </label>
          <Password
            inputId="access-key"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            feedback={false}
            toggleMask
            autoFocus
            autoComplete="current-password"
            className="w-full"
            inputClassName="w-full"
          />
        </div>

        <Button type="submit" label="Sign in" icon="pi pi-sign-in" loading={busy} disabled={!accessKey} className="w-full" />
      </form>
    </main>
  )
}
