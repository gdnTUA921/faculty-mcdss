'use client'

import { FiAlertCircle, FiInbox, FiRefreshCw } from 'react-icons/fi'

/** Skeleton rows for a table body while the first fetch is in flight. */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-[#E2E8F0]">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-4 py-4">
              <div className="h-3 bg-[#E2E8F0] rounded animate-pulse" style={{ width: `${50 + ((r + c) % 4) * 12}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <div className="h-3 w-24 bg-[#E2E8F0] rounded animate-pulse mb-3" />
          <div className="h-6 w-16 bg-[#E2E8F0] rounded animate-pulse" />
        </div>
      ))}
    </>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="w-7 h-7 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      {label && <p className="text-sm text-[#64748B]">{label}</p>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
      <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
        <FiAlertCircle className="w-5 h-5 text-red-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1E293B]">Could not load this data</p>
        <p className="text-sm text-[#64748B] mt-1 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 mt-1 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFF]"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
      <div className="w-11 h-11 rounded-full bg-[#F1F5F9] flex items-center justify-center">
        <FiInbox className="w-5 h-5 text-[#94A3B8]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1E293B]">{title}</p>
        {description && <p className="text-sm text-[#64748B] mt-1 max-w-md">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** Inline banner for mutation failures — keeps the form on screen. */
export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg mb-4">
      <FiAlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-red-800 flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-600 hover:text-red-800 text-xs font-semibold">
          Dismiss
        </button>
      )}
    </div>
  )
}

export function SuccessBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 bg-green-50 border border-green-200 rounded-lg mb-4">
      <p className="text-sm text-green-800 flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-green-700 hover:text-green-900 text-xs font-semibold">
          Dismiss
        </button>
      )}
    </div>
  )
}
