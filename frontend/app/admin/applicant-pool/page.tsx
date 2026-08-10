'use client'

import { useState } from 'react'
import { FiMail, FiX, FiChevronDown, FiClock } from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { EmptyState, ErrorBanner, ErrorState, SuccessBanner, TableSkeleton } from '@/components/shared/DataState'
import { ApiError } from '@/lib/api/client'
import {
  getApplicantPool,
  getDepartments,
  getHiringRounds,
  reengagePoolEntry,
  updatePoolStatus,
} from '@/lib/api/admin'
import { fullName } from '@/lib/format'
import { useResource } from '@/lib/useResource'
import type { PoolEntry } from '@/lib/types'

export default function ApplicantPoolPage() {
  const [roundFilter, setRoundFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: departments } = useResource(getDepartments, [])
  const { data: rounds } = useResource(() => getHiringRounds(), [])

  const { data: pool, loading, error, reload } = useResource(
    () =>
      getApplicantPool({
        hiring_round_id: roundFilter === 'all' ? undefined : roundFilter,
        department_id: deptFilter === 'all' ? undefined : deptFilter,
        pool_status: statusFilter === 'all' ? undefined : statusFilter,
        applicant_type: typeFilter === 'all' ? undefined : typeFilter,
      }),
    [roundFilter, deptFilter, statusFilter, typeFilter],
  )

  const rows = pool ?? []
  const activeCount = rows.filter((m) => m.pool_status === 'active').length
  const reengagedCount = rows.filter((m) => m.pool_status === 'reengaged').length
  const inactiveCount = rows.filter((m) => m.pool_status === 'inactive' || m.pool_status === 'expired').length

  async function handleReengage(entry: PoolEntry) {
    setActionError(null)
    setBusyId(entry.id)
    try {
      await reengagePoolEntry(entry.id)
      setNotice(`Re-engagement email sent to ${entry.applicant?.email ?? 'the applicant'}.`)
      reload()
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? (Object.values(err.errors)[0]?.[0] ?? err.message)
          : 'Could not send the re-engagement email.',
      )
    } finally {
      setBusyId(null)
    }
  }

  async function handleSetStatus(entry: PoolEntry, status: 'inactive' | 'expired') {
    setActionError(null)
    setBusyId(entry.id)
    try {
      await updatePoolStatus(entry.id, status)
      setNotice(`Pool entry marked ${status}.`)
      reload()
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? (err.fieldError('status') ?? err.message)
          : 'Could not update the pool status.',
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Applicant Pool"
        subtitle="Manage previous applicants retained for future consideration"
      />

      {notice && <SuccessBanner message={notice} onDismiss={() => setNotice(null)} />}
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}

      {/* Summary Stats */}
      <div className="flex flex-wrap gap-4 mb-6">
        <SummaryTile color="#2563EB" value={activeCount} label="Active Pool Members" loading={loading} />
        <SummaryTile color="#16A34A" value={reengagedCount} label="Re-engaged" loading={loading} />
        <SummaryTile color="#CBD5E1" value={inactiveCount} label="Inactive / Expired" loading={loading} />
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-center shadow-sm">
        <Select
          label="Round"
          value={roundFilter}
          onChange={setRoundFilter}
          options={[
            { value: 'all', label: 'All Rounds' },
            ...(rounds ?? []).map((r) => ({ value: r.id, label: r.name })),
          ]}
        />
        <Select
          label="Department"
          value={deptFilter}
          onChange={setDeptFilter}
          options={[
            { value: 'all', label: 'All Departments' },
            ...(departments ?? []).map((d) => ({ value: d.id, label: d.code })),
          ]}
        />
        <Select
          label="Pool Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'reengaged', label: 'Re-engaged' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'expired', label: 'Expired' },
          ]}
        />
        <Select
          label="Type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'external', label: 'External' },
            { value: 'internal', label: 'Internal' },
          ]}
        />
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
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applicant</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Original Position</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Original Round</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Pool Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Re-engagement</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Confirmed Interest</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                {loading ? (
                  <TableSkeleton rows={5} cols={8} />
                ) : (
                  <tbody>
                    {rows.map((member, idx) => (
                      <tr
                        key={member.id}
                        className={
                          idx % 2 === 0
                            ? 'bg-white border-b border-[#F1F5F9]'
                            : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'
                        }
                      >
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-[#1E293B]">
                            {fullName(member.applicant?.first_name, member.applicant?.last_name)}
                          </p>
                          <p className="text-xs text-[#64748B]">{member.applicant?.email ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          {member.applicant ? <StatusBadge status={member.applicant.applicant_type} /> : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-[#64748B] text-xs">
                          {member.position?.title ?? '—'}
                          <span className="block font-semibold">
                            {member.position?.department?.name ?? ''}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[#64748B] text-xs">{member.hiring_round?.name ?? '—'}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={member.pool_status} />
                        </td>
                        <td className="px-4 py-3.5">
                          {member.reengagement_email_sent ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                              Not Sent
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <ConfirmedInterest value={member.confirmed_interest} />
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleReengage(member)}
                              disabled={busyId === member.id || member.reengagement_email_sent}
                              title={
                                member.reengagement_email_sent
                                  ? 'A re-engagement email has already been sent'
                                  : 'Send a re-engagement email'
                              }
                              className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors border border-blue-200 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <FiMail className="w-3.5 h-3.5" />
                              Re-engage
                            </button>
                            <button
                              onClick={() => handleSetStatus(member, 'inactive')}
                              disabled={busyId === member.id || member.pool_status === 'inactive'}
                              className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors border border-[#E2E8F0] whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <FiX className="w-3.5 h-3.5" />
                              Inactive
                            </button>
                            <button
                              onClick={() => handleSetStatus(member, 'expired')}
                              disabled={busyId === member.id || member.pool_status === 'expired'}
                              className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors border border-[#E2E8F0] whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <FiClock className="w-3.5 h-3.5" />
                              Expire
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
            {!loading && rows.length === 0 && (
              <EmptyState
                title="No pool members match these filters"
                description="Applicants enter the pool automatically when a hiring round is closed without hiring them."
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ConfirmedInterest({ value }: { value: boolean | null }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        Yes
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        No
      </span>
    )
  }
  return <StatusBadge status="pending" />
}

function SummaryTile({
  color,
  value,
  label,
  loading,
}: {
  color: string
  value: number
  label: string
  loading: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm px-5 py-3 flex items-center gap-3">
      <div className="w-2 h-8 rounded-full" style={{ backgroundColor: color }} />
      <div>
        {loading ? (
          <div className="h-7 w-8 bg-[#E2E8F0] rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-[#1E293B]">{value}</p>
        )}
        <p className="text-xs text-[#64748B] font-medium">{label}</p>
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 max-w-[190px] truncate"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <FiChevronDown className="absolute right-2 top-2 w-4 h-4 text-[#64748B] pointer-events-none" />
      </div>
    </div>
  )
}
