/**
 * Core API client. Every request to the Laravel backend goes through here so
 * token attachment, error shaping and 401 handling live in exactly one place.
 */

// docker-compose sets this to http://localhost:8000/api. The fallback covers a
// bare `npm run dev` on the host.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

const TOKEN_KEY = 'mcdss_token'
const USER_KEY = 'mcdss_user'

export type Role = 'admin' | 'director' | 'internal_applicant' | 'external_applicant'

export interface AuthUser {
  id: string
  first_name: string
  last_name: string
  email: string
  role: Role
}

/** Laravel returns 422 with a field-keyed `errors` object; keep it intact for forms. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** First validation message for a field, if the backend rejected it. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0]
  }
}

// ─── Token storage ───────────────────────────────────────────────────────────
// localStorage rather than a cookie because Sanctum is issuing bearer tokens,
// not a session cookie. Guarded for SSR, where `window` does not exist.

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function storeSession(token: string, user: AuthUser): void {
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

// ─── Request ─────────────────────────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** FormData for uploads — Content-Type is left to the browser so the boundary is set. */
  formData?: FormData
  query?: Record<string, string | number | boolean | undefined | null>
  /** Skip the automatic redirect-to-login on 401 (used by the login call itself). */
  skipAuthRedirect?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

async function parseError(response: Response): Promise<ApiError> {
  let message = response.statusText || 'Request failed'
  let errors: Record<string, string[]> = {}

  try {
    const body = await response.json()
    if (typeof body?.message === 'string') message = body.message
    if (body?.errors && typeof body.errors === 'object') errors = body.errors
  } catch {
    // Non-JSON error body (e.g. an HTML error page) — keep the status text.
  }

  return new ApiError(response.status, message, errors)
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, query, skipAuthRedirect } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    cache: 'no-store',
  })

  // An expired or revoked token should drop the stale session rather than leave
  // the UI in a half-authenticated state.
  if (response.status === 401 && !skipAuthRedirect) {
    clearSession()
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/'
    }
    throw new ApiError(401, 'Your session has expired. Please sign in again.')
  }

  if (!response.ok) throw await parseError(response)

  if (response.status === 204) return undefined as T

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

/** Downloads a file (CSV export, document) using the bearer token. */
export async function downloadFile(
  path: string,
  query?: RequestOptions['query'],
  fallbackName = 'download',
): Promise<void> {
  const token = getToken()

  const response = await fetch(buildUrl(path, query), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })

  if (!response.ok) throw await parseError(response)

  // Prefer the server's filename so exports keep their timestamp.
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  const filename = match ? decodeURIComponent(match[1]) : fallbackName

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
