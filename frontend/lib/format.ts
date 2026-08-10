/** Display formatting for API values. The API sends ISO 8601 strings and decimals-as-strings. */

const PH_LOCALE = 'en-PH'

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(PH_LOCALE, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(PH_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Short form for activity feeds — no year. */
export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(PH_LOCALE, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Decimals arrive as strings from Postgres; keep 4 places like the WSM model. */
export function formatScore(value: string | number | null | undefined, digits = 4): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(n) ? '—' : n.toFixed(digits)
}

export function formatPercent(value: string | number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(n) ? '—' : `${(n * 100).toFixed(digits)}%`
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function initials(first?: string | null, last?: string | null): string {
  const a = first?.trim()?.[0] ?? ''
  const b = last?.trim()?.[0] ?? ''
  return (a + b).toUpperCase() || '—'
}

export function fullName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(' ') || '—'
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  applied: 'Applied',
  for_interview: 'For Interview',
  for_review: 'For Review',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export function statusLabel(status: string | null | undefined): string {
  if (!status) return '—'
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ')
}

export function humanize(value: string | null | undefined): string {
  if (!value) return '—'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Days until a deadline; negative when it has passed. Null when unset. */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}
