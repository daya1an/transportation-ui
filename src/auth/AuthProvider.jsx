import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setUnauthorizedHandler } from '../api/client'
import { getAuthConfig, login as loginRequest } from '../api/endpoints'
import { clearToken, getToken, setToken } from './tokenStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [config, setConfig] = useState({ loading: true, error: null, authRequired: true })
  const [token, setTokenState] = useState(() => getToken())
  const [sessionExpired, setSessionExpired] = useState(false)
  const [attempt, setAttempt] = useState(0)

  // Ask the server whether a login is needed at all (AUTH_ENABLED=false skips it)
  useEffect(() => {
    const controller = new AbortController()
    setConfig((c) => ({ ...c, loading: true, error: null }))
    getAuthConfig(controller.signal)
      .then((body) => setConfig({ loading: false, error: null, authRequired: body.auth_required }))
      .catch((error) => {
        if (error?.name !== 'AbortError') setConfig((c) => ({ ...c, loading: false, error }))
      })
    return () => controller.abort()
  }, [attempt])

  // Any 401 from any request ends the session, and cached data from the old session is dropped
  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear()
      setTokenState(null)
      setSessionExpired(true)
    })
    return () => setUnauthorizedHandler(null)
  }, [queryClient])

  const login = useCallback(async (accessKey) => {
    const body = await loginRequest(accessKey)
    setToken(body.access_token)
    setTokenState(body.access_token)
    setSessionExpired(false)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    queryClient.clear()
    setTokenState(null)
    setSessionExpired(false)
  }, [queryClient])

  const retryConfig = useCallback(() => setAttempt((n) => n + 1), [])

  const value = useMemo(
    () => ({
      loading: config.loading,
      configError: config.error,
      authRequired: config.authRequired,
      isAuthenticated: !config.authRequired || Boolean(token),
      sessionExpired,
      login,
      logout,
      retryConfig,
    }),
    [config, token, sessionExpired, login, logout, retryConfig],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
