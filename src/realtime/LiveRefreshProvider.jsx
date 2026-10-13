import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthProvider'
import { LiveConnection } from './LiveConnection'
import { resolveStreamUrl } from './streamUrl'

const LiveContext = createContext({ status: 'idle', events: [] })
const MAX_EVENTS = 5

/** One stream for the whole app. Every refresh event invalidates all queries, so visible data refetches. */
export function LiveRefreshProvider({ children }) {
  const queryClient = useQueryClient()
  const { authRequired } = useAuth()
  const [status, setStatus] = useState('connecting')
  const [events, setEvents] = useState([])

  useEffect(() => {
    const connection = new LiveConnection({
      resolveUrl: () => resolveStreamUrl(authRequired),
      onStatus: setStatus,
      onRefresh: (payload) => {
        queryClient.invalidateQueries() // the ETag makes unchanged refetches nearly free
        setEvents((previous) => [{ ...payload, receivedAt: Date.now() }, ...previous].slice(0, MAX_EVENTS))
      },
    })
    connection.start()
    return () => connection.stop()
  }, [authRequired, queryClient])

  const value = useMemo(() => ({ status, events }), [status, events])
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>
}

export const useLive = () => useContext(LiveContext)
