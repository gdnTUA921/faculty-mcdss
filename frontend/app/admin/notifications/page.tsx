'use client'

import { useState } from 'react'
import {
  FiBell,
  FiPlus,
  FiRefreshCw,
  FiX,
  FiChevronDown,
} from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { notifications, applicants } from '@/lib/adminData'

function formatDateTime(ts: string) {
  return new Date(ts).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotificationsPage() {
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  // Modal form state
  const [formRecipient, setFormRecipient] = useState('')
  const [formType, setFormType] = useState('application_received')
  const [formSubject, setFormSubject] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formChannel, setFormChannel] = useState('email')

  const filtered = notifications.filter((n) => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false
    if (statusFilter !== 'all' && n.deliveryStatus !== statusFilter) return false
    return true
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setShowModal(false)
    setFormRecipient('')
    setFormType('application_received')
    setFormSubject('')
    setFormBody('')
    setFormChannel('email')
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Notifications"
        subtitle="Track and manage all system notifications"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Trigger Notification
          </button>
        }
      />

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
              <option value="status_change">Status Change</option>
              <option value="pool_invitation">Pool Invitation</option>
              <option value="account_created">Account Created</option>
            </select>
            <FiChevronDown className="absolute right-2 top-2 w-4 h-4 text-[#64748B] pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Delivery Status</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <FiChevronDown className="absolute right-2 top-2 w-4 h-4 text-[#64748B] pointer-events-none" />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-[#64748B]">
            {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Recipient</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Channel</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Delivery</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Sent At</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">
                    No notifications match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((notif, idx) => (
                  <tr
                    key={notif.id}
                    className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-[#1E293B]">{notif.recipientName}</p>
                      <p className="text-xs text-[#64748B]">{notif.recipientEmail}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={notif.type} />
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="text-[#1E293B] text-xs leading-relaxed line-clamp-2">{notif.subject}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={notif.channel} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={notif.deliveryStatus} />
                    </td>
                    <td className="px-4 py-3.5 text-[#64748B] text-xs whitespace-nowrap">
                      {formatDateTime(notif.sentAt)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end">
                        {notif.deliveryStatus === 'failed' && (
                          <button className="flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-200">
                            <FiRefreshCw className="w-3.5 h-3.5" />
                            Resend
                          </button>
                        )}
                        {notif.deliveryStatus !== 'failed' && (
                          <span className="text-xs text-[#64748B]">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trigger Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <FiBell className="w-5 h-5 text-[#2563EB]" />
                <h2 className="text-lg font-bold text-[#1E293B]">Trigger Manual Notification</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#64748B] hover:text-[#1E293B] p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-1">Recipient <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    required
                    value={formRecipient}
                    onChange={(e) => setFormRecipient(e.target.value)}
                    className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white"
                  >
                    <option value="">Select recipient</option>
                    {applicants.map((a) => (
                      <option key={a.id} value={a.id}>{a.fullName} — {a.email}</option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1">Type <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      required
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white"
                    >
                      <option value="application_received">Application Received</option>
                      <option value="status_change">Status Change</option>
                      <option value="pool_invitation">Pool Invitation</option>
                      <option value="account_created">Account Created</option>
                    </select>
                    <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1">Channel</label>
                  <div className="relative">
                    <select
                      value={formChannel}
                      onChange={(e) => setFormChannel(e.target.value)}
                      className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white"
                    >
                      <option value="email">Email</option>
                      <option value="in_app">In-App</option>
                    </select>
                    <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-1">Subject <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Notification subject line"
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-1">Message Body</label>
                <textarea
                  rows={4}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Enter the notification message..."
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] resize-none"
                />
              </div>
            </form>

            <div className="flex gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-gray-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 border border-[#E2E8F0] text-[#64748B] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
