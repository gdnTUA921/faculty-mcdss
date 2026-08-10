'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FiPlus, FiEye, FiX, FiChevronDown, FiCheckCircle } from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import PositionFormModal from '@/components/admin/PositionFormModal'
import StatusBadge from '@/components/shared/StatusBadge'
import { EmptyState, ErrorBanner, ErrorState, SuccessBanner, TableSkeleton } from '@/components/shared/DataState'
import { ApiError } from '@/lib/api/client'
import { getDepartments, getPositions, setPositionStatus } from '@/lib/api/admin'
import { formatDate } from '@/lib/format'
import { useResource } from '@/lib/useResource'

type StatusFilter = 'all' | 'open' | 'closed' | 'filled'
type TypeFilter = 'all' | 'external' | 'internal' | 'both'

export default function PositionsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [showModal, setShowModal] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: departments } = useResource(getDepartments, [])

  const { data: positions, loading, error, reload } = useResource(
    () =>
      getPositions({
        status: statusFilter === 'all' ? undefined : statusFilter,
        department_id: deptFilter === 'all' ? undefined : deptFilter,
      }),
    [statusFilter, deptFilter],
  )

  // target_applicant_type has no server-side filter, so narrow it client-side.
  const rows = (positions ?? []).filter(
    (p) => typeFilter === 'all' || p.target_applicant_type === typeFilter,
  )

  async function handleStatusChange(id: string, title: string, status: 'open' | 'closed') {
    setActionError(null)
    try {
      await setPositionStatus(id, status)
      setNotice(`"${title}" is now ${status}.`)
      reload()
    } catch (err) {
      setActionError(
        err instanceof ApiError ? (err.fieldError('status') ?? err.message) : 'Could not update the position.',
      )
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Positions"
        subtitle="Manage faculty position listings and criteria"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Create Position
          </button>
        }
      />

      {notice && <SuccessBanner message={notice} onDismiss={() => setNotice(null)} />}
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center shadow-sm">
        <Select
          label="Status"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'open', label: 'Open' },
            { value: 'closed', label: 'Closed' },
            { value: 'filled', label: 'Filled' },
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
          label="Target Type"
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as TypeFilter)}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'external', label: 'External' },
            { value: 'internal', label: 'Internal' },
            { value: 'both', label: 'Both' },
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
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Department</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Slots</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Criteria</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Deadline</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                {loading ? (
                  <TableSkeleton rows={6} cols={8} />
                ) : (
                  <tbody>
                    {rows.map((pos, idx) => (
                      <tr
                        key={pos.id}
                        className={
                          idx % 2 === 0
                            ? 'bg-white border-b border-[#F1F5F9]'
                            : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'
                        }
                      >
                        <td className="px-6 py-3.5">
                          <Link
                            href={`/admin/positions/${pos.id}`}
                            className="font-semibold text-[#1E293B] hover:text-[#2563EB] hover:underline"
                          >
                            {pos.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[#1E293B]">{pos.department?.code ?? '—'}</span>
                          <p className="text-xs text-[#64748B] mt-0.5 hidden md:block">
                            {pos.department?.name ?? ''}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={pos.target_applicant_type} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[#1E293B] font-medium">
                            {pos.slots_filled} / {pos.slots_available}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[#64748B] text-xs">
                          {pos.criteria_count ?? 0} criteria
                          {(pos.criteria_count ?? 0) === 0 && (
                            <span className="block text-amber-600 font-semibold">Needs setup</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={pos.status} />
                        </td>
                        <td className="px-4 py-3.5 text-[#64748B] text-sm">
                          {formatDate(pos.application_deadline)}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/positions/${pos.id}`}
                              className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors"
                              title="View & edit"
                            >
                              <FiEye className="w-4 h-4" />
                            </Link>
                            {pos.status === 'open' ? (
                              <button
                                onClick={() => handleStatusChange(pos.id, pos.title, 'closed')}
                                className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-md transition-colors"
                                title="Close position"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(pos.id, pos.title, 'open')}
                                className="p-1.5 text-[#64748B] hover:text-[#16A34A] hover:bg-green-50 rounded-md transition-colors"
                                title="Re-open position"
                              >
                                <FiCheckCircle className="w-4 h-4" />
                              </button>
                            )}
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
                title="No positions match these filters"
                description="Create a position to start accepting applications."
                action={
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    <FiPlus className="w-4 h-4" />
                    Create Position
                  </button>
                }
              />
            )}
          </>
        )}
      </div>

      {showModal && (
        <PositionFormModal
          position={null}
          departments={(departments ?? []).map((d) => ({ id: d.id, code: d.code, name: d.name }))}
          onClose={() => setShowModal(false)}
          onSaved={(title) => {
            setShowModal(false)
            setNotice(`"${title}" created. Add criteria before opening it.`)
            reload()
          }}
        />
      )}
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
          className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
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
