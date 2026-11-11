import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { apiRequest, ApiError } from './api'

export type AuthUser = {
  id: string
  email: string
  fullName: string
  role: 'customer' | 'merchant' | 'admin'
  storeStatus: 'pending' | 'approved' | 'suspended' | null
}

type Registration = {
  email: string
  password: string
  fullName: string
  phone?: string
  role: 'customer' | 'merchant'
  storeName?: string
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<AuthUser>
  register: (input: Registration) => Promise<AuthUser>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (__NAHORA_STATIC_PREVIEW__) {
      setLoading(false)
      return
    }
    let active = true
    apiRequest<{ user: AuthUser | null }>('/api/auth/me')
      .then(({ user: current }) => {
        if (active) setUser(current)
      })
      .catch((cause: unknown) => {
        if (!active) return
        if (cause instanceof ApiError && cause.status === 401) return setUser(null)
        setError(cause instanceof Error ? cause.message : 'Unable to reach the NAHORA server.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    error,
    clearError: () => setError(null),
    login: async (email, password) => {
      setError(null)
      try {
        const result = await apiRequest<{ user: AuthUser }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setUser(result.user)
        return result.user
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Unable to sign in.'
        setError(message)
        throw cause
      }
    },
    register: async (input) => {
      setError(null)
      try {
        const result = await apiRequest<{ user: AuthUser }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(input),
        })
        setUser(result.user)
        return result.user
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Unable to create your account.'
        setError(message)
        throw cause
      }
    },
    logout: async () => {
      await apiRequest<void>('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setError(null)
    },
  }), [error, loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
