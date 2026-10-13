import { NavLink } from 'react-router-dom'
import { Button } from 'primereact/button'
import { useAuth } from '../features/auth/AuthProvider'
import ThemeToggle from '../features/theme/ThemeToggle'
import Logo from './Logo'
import { NAV_ITEMS } from './navItems'

// Active item inverts the colors (dark pill on light theme, light pill on dark), like the reference design
const linkClass = ({ isActive }) =>
  `flex h-11 w-11 items-center justify-center rounded-xl text-lg transition-colors ${
    isActive ? 'bg-fg text-card' : 'text-muted hover:bg-line/60 hover:text-fg'
  }`

/**
 * One navigation element, two layouts: a bottom bar on phones, a vertical rail from the md breakpoint up.
 * Rendering it once (instead of one copy per layout) keeps the DOM and the tests simple.
 */
export default function NavRail() {
  const { authRequired, logout } = useAuth()
  return (
    <aside
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-line bg-card/95 px-4 py-2 backdrop-blur
        md:sticky md:inset-x-auto md:bottom-auto md:top-4 md:h-[calc(100vh-2rem)] md:w-[72px] md:shrink-0 md:flex-col md:gap-2
        md:self-start md:rounded-2xl md:border md:px-0 md:py-4"
    >
      <Logo />
      <nav className="flex flex-1 items-center gap-2 md:mt-4 md:flex-col md:justify-start">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} title={item.label} aria-label={item.label} className={linkClass}>
            <i className={item.icon} />
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-1 md:flex-col">
        <ThemeToggle />
        {authRequired && (
          <Button icon="pi pi-sign-out" onClick={logout} rounded text severity="secondary" aria-label="Sign out" title="Sign out" />
        )}
      </div>
    </aside>
  )
}
