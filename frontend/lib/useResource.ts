'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from './api/client'

interface ResourceState<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** Re-runs the fetcher, e.g. after a mutation. */
  reload: () => void
}

/**
 * Fetches on mount and whenever `deps` change.
 *
 * `deps` is a plain dependency array like useEffect's. Pass primitives (ids,
 * filter strings) — not object literals, which change identity every render.
 */
export function useResource<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): ResourceState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  // Keeps the latest fetcher without making it a dependency, so callers don't
  // have to wrap every fetcher in useCallback.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    fetcherRef
      .current()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err: unknown) => {
        if (!active) return
        // A 401 already redirected to the login screen; no error banner needed.
        if (err instanceof ApiError && err.status === 401) return
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { data, loading, error, reload }
}

/** Tracks an in-flight mutation (button spinners, inline form errors). */
export function useMutation<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ApiError | Error | null>(null)

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setPending(true)
      setError(null)
      try {
        return await action(...args)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Something went wrong.'))
        return undefined
      } finally {
        setPending(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return { run, pending, error, clearError: () => setError(null) }
}
