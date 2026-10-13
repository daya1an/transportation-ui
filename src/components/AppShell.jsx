import { Outlet } from 'react-router-dom'
import { Button } from 'primereact/button'
import { useAuth } from '../auth/AuthProvider'
import { LiveRefreshProvider } from '../realtime/LiveRefreshProvider'
import ThemeToggle from '../theme/ThemeToggle'
import LiveBadge from './LiveBadge'

/** Frame for every private page. Owns the live stream so the badge and the pages share one connection. */
export default function AppShell() {
  const { authRequired, logout } = useAuth()
  return (
    <LiveRefreshProvider>
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-card/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <i className="pi pi-chart-bar text-xl text-accent" />
            <span className="font-semibold text-fg">Trips dashboard</span>
            <LiveBadge />
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {authRequired && (
              <Button label="Sign out" icon="pi pi-sign-out" onClick={logout} text severity="secondary" size="small" />
            )}
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </LiveRefreshProvider>
  )
}
