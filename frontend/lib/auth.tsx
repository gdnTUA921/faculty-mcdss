'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AuthUser,
  Role,
  clearSession,
  getStoredUser,
  getToken,
  request,
  storeSession,
} from './api/client'

interface LoginResult {
  token: string
  has_temp_password: boolean
  user: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  /** True until the stored session has been read — guards must wait for this. */
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Where each role lands after signing in. */
export const HOME_FOR_ROLE: Record<Role, string> = {
  admin: '/admin',
  director: '/director',
  internal_applicant: '/applicant/dashboard',
  external_applicant: '/applicant/dashboard',
}

export function isApplicant(role: Role | undefined): boolean {
  return role === 'internal_applicant' || role === 'external_applicant'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Hydrate from localStorage first so a refresh does not flash the login screen,
  // then confirm the token is still valid against the API.
  useEffect(() => {
    const stored = getStoredUser()
    if (!stored || !getToken()) {
      setLoading(false)
      return
    }

    setUser(stored)

    request<AuthUser>('/auth/user', { skipAuthRedirect: true })
      .then((fresh) => setUser(fresh))
      .catch(() => {
        clearSession()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await request<LoginResult>('/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuthRedirect: true,
    })

    storeSession(result.token, result.user)
    setUser(result.user)
    return result.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await request('/auth/logout', { method: 'POST', skipAuthRedirect: true })
    } catch {
      // Revoking server-side is best-effort; the local session goes either way.
    }
    clearSession()
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const fresh = await request<AuthUser>('/auth/user')
    setUser(fresh)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/**
 * Client-side route guard. Wraps the children of each role layout so the layouts
 * themselves stay server components and keep exporting `metadata`.
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: Role[]
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/')
      return
    }

    // Signed in but on someone else's dashboard — bounce to their own.
    if (!roles.includes(user.role)) {
      router.replace(HOME_FOR_ROLE[user.role])
    }
  }, [user, loading, roles, router])

  if (loading || !user || !roles.includes(user.role)) {
    return <FullPageSpinner />
  }

  return <>{children}</>
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFF]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#64748B]">Loading…</p>
      </div>
    </div>
  )
}
