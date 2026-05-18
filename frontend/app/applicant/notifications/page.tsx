'use client'

import { useState } from 'react'
import {
  FiBell,
  FiMail,
  FiInfo,
  FiCheckCircle,
  FiUserCheck,
  FiRefreshCw,
  FiCheck,
} from 'react-icons/fi'
import { myNotifications, notificationTypeLabel } from '@/lib/applicantData'

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const typeIcons: Record<string, typeof FiBell> = {
  status_change: FiRefreshCw,
  application_received: FiCheckCircle,
  account_created: FiUserCheck,
  pool_invitation: FiMail,
  reengagement: FiInfo,
}

const typeColors: Record<string, string> = {
  status_change: 'bg-purple-100 text-purple-700',
  application_received: 'bg-blue-100 text-blue-700',
  account_created: 'bg-green-100 text-green-700',
  pool_invitation: 'bg-teal-100 text-teal-700',
  reengagement: 'bg-amber-100 text-amber-700',
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [notifications, setNotifications] = useState(myNotifications)

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications
  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight mb-1">
            Notifications
          </h1>
          <p className="text-sm text-[#64748B]">
            {unreadCount} unread · {notifications.length} total
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#2563EB] text-[#2563EB] rounded-lg text-sm font-semibold hover:bg-[#DBEAFE] transition-colors w-full sm:w-auto justify-center"
          >
            <FiCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-[#E2E8F0]">
        <button
          onClick={() => setFilter('all')}
          className={
            filter === 'all'
              ? 'px-4 py-2.5 text-sm font-semibold text-[#2563EB] border-b-2 border-[#2563EB] -mb-px'
              : 'px-4 py-2.5 text-sm font-medium text-[#64748B] hover:text-[#1E293B] border-b-2 border-transparent -mb-px'
          }
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={
            filter === 'unread'
              ? 'px-4 py-2.5 text-sm font-semibold text-[#2563EB] border-b-2 border-[#2563EB] -mb-px'
              : 'px-4 py-2.5 text-sm font-medium text-[#64748B] hover:text-[#1E293B] border-b-2 border-transparent -mb-px'
          }
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm divide-y divide-[#E2E8F0]">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FiBell className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
            <p className="text-base font-semibold text-[#1E293B] mb-1">No notifications</p>
            <p className="text-sm text-[#64748B]">You&apos;re all caught up!</p>
          </div>
        ) : (
          filtered.map((notif) => {
            const Icon = typeIcons[notif.type] ?? FiBell
            const colorClass = typeColors[notif.type] ?? 'bg-blue-100 text-blue-700'
            return (
              <div
                key={notif.id}
                className={
                  notif.read
                    ? 'p-4 sm:p-5 hover:bg-[#F8FAFF] cursor-pointer transition-colors'
                    : 'p-4 sm:p-5 hover:bg-blue-50 cursor-pointer transition-colors bg-blue-50/50'
                }
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        {notificationTypeLabel[notif.type] || 'Notification'}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#1E293B] mb-1 leading-snug">{notif.subject}</p>
                    <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">{notif.bodyPreview}</p>
                    <p className="text-xs text-[#94A3B8] mt-2">{formatTimestamp(notif.sentAt)}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
