import { Navigate, useLocation } from 'react-router-dom'
import { Button } from 'primereact/button'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useAuth } from './AuthProvider'

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
      <ProgressSpinner style={{ width: '2.5rem', height: '2.5rem' }} strokeWidth="5" />
    </div>
  )
}

/** Wraps private routes: waits for the auth config, then redirects to /login when needed. */
export default function RequireAuth({ children }) {
  const { loading, configError, isAuthenticated, retryConfig } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenSpinner />
  if (configError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <i className="pi pi-exclamation-triangle text-3xl text-amber-500" />
        <p className="max-w-md text-muted">{configError.message}</p>
        <Button label="Try again" icon="pi pi-refresh" onClick={retryConfig} />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}
