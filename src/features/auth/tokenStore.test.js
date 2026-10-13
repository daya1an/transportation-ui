import { describe, expect, it } from 'vitest'
import { clearToken, getToken, setToken } from './tokenStore'

const jwtExpiring = (exp) => `h.${btoa(JSON.stringify({ exp })).replace(/=/g, '')}.s`

describe('tokenStore', () => {
  it('stores, returns and clears a token', () => {
    expect(getToken()).toBeNull()
    setToken('abc')
    expect(getToken()).toBe('abc')
    clearToken()
    expect(getToken()).toBeNull()
  })

  it('keeps a token that has not expired', () => {
    const token = jwtExpiring(Math.floor(Date.now() / 1000) + 3600)
    setToken(token)
    expect(getToken()).toBe(token)
  })

  it('drops an expired token', () => {
    setToken(jwtExpiring(Math.floor(Date.now() / 1000) - 10))
    expect(getToken()).toBeNull()
    expect(sessionStorage.getItem('trips.token')).toBeNull()
  })

  it('keeps tokens it cannot decode, the server decides', () => {
    setToken('not-a-jwt')
    expect(getToken()).toBe('not-a-jwt')
  })
})
