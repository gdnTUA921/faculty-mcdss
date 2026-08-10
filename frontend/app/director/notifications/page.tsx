'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FiBell, FiCheck, FiUserPlus } from 'react-icons/fi'
import { EmptyState, ErrorBanner, ErrorState, Spinner } from '@/components/shared/DataState'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/api/applicant'
import { formatDateTime, humanize } from '@/lib/format'
import { useResource } from '@/lib/useResource'

const typeIcons: Record<string, typeof FiBell> = {
  application_submitted: FiUserPlus,
}

const typeColors: Record<string, string> = {
  application_submitted: 'bg-blue-100 text-blue-700',
}

export default function DirectorNotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, loading, error, reload } = useResource(
    () => getNotifications(filter === 'unread'),
    [filter],
  )

  const notifications = data?.data ?? []
  const unreadCount = data?.meta.unread_count ?? 0

  async function handleMarkRead(id: string) {
    setActionError(null)
    setBusyId(id)
    try {
      await markNotificationRead(id)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not mark it as read.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleMarkAllRead() {
    setActionError(null)
    try {
      await markAllNotificationsRead()
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not mark all as read.')
    }
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight mb-1">Notifications</h1>
          <p className="text-sm text-[#64748B]">
            {unreadCount} unread · {data?.meta.total ?? 0} total
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] text-[#1E293B] rounded-lg text-sm font-semibold hover:bg-[#F8FAFF] transition-colors"
          >
            <FiCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setFilter('all')}
          className={
            filter === 'all'
              ? 'px-4 py-2 rounded-lg text-sm font-semibold bg-[#2563EB] text-white'
              : 'px-4 py-2 rounded-lg text-sm font-medium bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
          }
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={
            filter === 'unread'
              ? 'px-4 py-2 rounded-lg text-sm font-semibold bg-[#2563EB] text-white'
              : 'px-4 py-2 rounded-lg text-sm font-medium bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
          }
        >
          Unread ({unreadCount})
        </button>
      </div>

      {error ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : loading ? (
        <Spinner label="Loading notifications…" />
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <EmptyState
            title={filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
            description="You'll be notified here when an applicant submits to a position in your department."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] ?? FiBell
            const color = typeColors[notif.type] ?? 'bg-gray-100 text-gray-700'
            const unread = notif.read_at === null

            return (
              <div
                key={notif.id}
                className={`bg-white rounded-xl border shadow-sm p-4 sm:p-5 transition-colors ${
                  unread ? 'border-[#2563EB]' : 'border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                        {humanize(notif.type)}
                      </p>
                      {unread && (
                        <span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#1E293B] mb-1">{notif.subject}</p>
                    <p className="text-sm text-[#64748B] leading-relaxed">{notif.body}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <p className="text-xs text-[#94A3B8]">{formatDateTime(notif.created_at)}</p>
                      {notif.application_id && (
                        <Link
                          href={`/director/applicants/${notif.application_id}`}
                          className="text-xs font-semibold text-[#2563EB] hover:underline"
                        >
                          View applicant →
                        </Link>
                      )}
                      {unread && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          disabled={busyId === notif.id}
                          className="text-xs font-semibold text-[#64748B] hover:text-[#1E293B] ml-auto disabled:opacity-50"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
