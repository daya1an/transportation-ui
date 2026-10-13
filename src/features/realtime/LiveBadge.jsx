import { useLive } from './LiveRefreshProvider'

const VIEW = {
  live: { label: 'Live', tone: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', pulse: true },
  connecting: { label: 'Connecting', tone: 'bg-sky-500/15 text-sky-600 dark:text-sky-400', dot: 'bg-sky-500', pulse: true },
  reconnecting: { label: 'Reconnecting', tone: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', pulse: true },
  offline: { label: 'Offline', tone: 'bg-red-500/15 text-red-600 dark:text-red-400', dot: 'bg-red-500', pulse: false },
  idle: { label: 'Idle', tone: 'bg-slate-500/15 text-muted', dot: 'bg-slate-400', pulse: false },
}

export default function LiveBadge() {
  const { status } = useLive()
  const view = VIEW[status] ?? VIEW.idle
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${view.tone}`}
    >
      <span className={`h-2 w-2 rounded-full ${view.dot} ${view.pulse ? 'animate-pulse' : ''}`} />
      {view.label}
    </span>
  )
}
