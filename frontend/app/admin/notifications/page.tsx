'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FiBell, FiCheck, FiChevronDown, FiInfo, FiMail } from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { EmptyState, ErrorBanner, ErrorState, SuccessBanner, TableSkeleton } from '@/components/shared/DataState'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/applicant'
import { formatDateTime } from '@/lib/format'
import { useResource } from '@/lib/useResource'

export default function NotificationsPage() {
  const [typeFilter, setTypeFilter] = useState('all')
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, loading, error, reload } = useResource(
    () => getNotifications(readFilter === 'unread'),
    [readFilter],
  )

  const all = data?.data ?? []
  const unreadCount = data?.meta.unread_count ?? 0
  const rows = typeFilter === 'all' ? all : all.filter((n) => n.type === typeFilter)

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
      const result = await markAllNotificationsRead()
      setNotice(`${result.updated_count} notification${result.updated_count === 1 ? '' : 's'} marked as read.`)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not mark all as read.')
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread · ${data?.meta.total ?? 0} total`}
        action={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <FiCheck className="w-4 h-4" />
              Mark all as read
            </button>
          ) : undefined
        }
      />

      {notice && <SuccessBanner message={notice} onDismiss={() => setNotice(null)} />}
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}

      <div className="flex items-start gap-2.5 mb-6 px-4 py-3 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg">
        <FiInfo className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#64748B]">
          This is your own notification inbox. Notifications are raised automatically by system events —
          application submitted, status changed, account created, round closed — so there is no manual
          trigger. Delivered email is captured by Mailpit at{' '}
          <a
            href="http://localhost:8025"
            target="_blank"
            rel="noreferrer"
            className="text-[#2563EB] hover:underline font-medium"
          >
            localhost:8025
          </a>{' '}
          during local development.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</label>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Types</option>
              <option value="application_received">Application Received</option>
              <option value="application_submitted">New Application Submitted</option>
              <option value="status_change">Status Change</option>
              <option value="account_created">Account Created</option>
              <option value="pool_invitation">Pool Invitation</option>
              <option value="reengagement">Re-engagement</option>
            </select>
            <FiChevronDown className="absolute right-2 top-2 w-4 h-4 text-[#64748B] pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-lg">
          <button
            onClick={() => setReadFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              readFilter === 'all' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setReadFilter('unread')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              readFilter === 'unread' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B]'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <span className="ml-auto text-sm text-[#64748B]">
          {rows.length} result{rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Subject</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Channel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Delivery</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Received</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                {loading ? (
                  <TableSkeleton rows={5} cols={6} />
                ) : (
                  <tbody>
                    {rows.map((n, idx) => (
                      <tr
                        key={n.id}
                        className={
                          n.read_at === null
                            ? 'bg-blue-50/60 border-b border-[#F1F5F9]'
                            : idx % 2 === 0
                              ? 'bg-white border-b border-[#F1F5F9]'
                              : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'
                        }
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-start gap-2">
                            {n.read_at === null && (
                              <span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-semibold text-[#1E293B]">{n.subject}</p>
                              <p className="text-xs text-[#64748B] mt-0.5 max-w-xl">{n.body}</p>
                              {n.application_id && (
                                <Link
                                  href={`/admin/applicants/${n.application_id}`}
                                  className="text-xs text-[#2563EB] hover:underline font-medium mt-1 inline-block"
                                >
                                  View application →
                                </Link>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={n.type} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={n.channel} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={n.delivery_status} />
                        </td>
                        <td className="px-4 py-3.5 text-[#64748B] text-xs whitespace-nowrap">
                          {formatDateTime(n.created_at)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {n.read_at === null ? (
                            <button
                              onClick={() => handleMarkRead(n.id)}
                              disabled={busyId === n.id}
                              className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 ml-auto disabled:opacity-40"
                            >
                              <FiMail className="w-3.5 h-3.5" />
                              Mark read
                            </button>
                          ) : (
                            <span className="text-xs text-[#94A3B8]">Read</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
            {!loading && rows.length === 0 && (
              <EmptyState
                title={readFilter === 'unread' ? 'Nothing unread' : 'No notifications yet'}
                description="Notifications addressed to your account will appear here."
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
