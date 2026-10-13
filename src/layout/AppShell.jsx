import { Outlet } from 'react-router-dom'
import { LiveRefreshProvider } from '../features/realtime/LiveRefreshProvider'
import NavRail from './NavRail'

/** Frame for every private page. Owns the live stream, so the badge and the pages share one connection. */
export default function AppShell() {
  return (
    <LiveRefreshProvider>
      <div className="min-h-screen md:p-4">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 md:min-h-[calc(100vh-2rem)] md:flex-row">
          <NavRail />
          <main className="min-w-0 flex-1 p-4 pb-24 md:p-0 md:pb-0">
            <Outlet />
          </main>
        </div>
      </div>
    </LiveRefreshProvider>
  )
}
