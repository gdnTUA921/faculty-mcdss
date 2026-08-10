'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  FiEye,
  FiEdit2,
  FiFileText,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiSearch,
} from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import StatusUpdateModal from '@/components/admin/StatusUpdateModal'
import { EmptyState, ErrorBanner, ErrorState, SuccessBanner, TableSkeleton } from '@/components/shared/DataState'
import {
  exportApplicants,
  getApplications,
  getDepartments,
  getHiringRounds,
  getPositions,
  type ApplicationFilters,
} from '@/lib/api/admin'
import { formatDate, formatScore } from '@/lib/format'
import { useResource } from '@/lib/useResource'
import type { ApplicationRow } from '@/lib/types'

type ApplicantTab = 'external' | 'internal'

const PER_PAGE = 25

export default function ApplicantsPage() {
  const [activeTab, setActiveTab] = useState<ApplicantTab>('external')
  const [positionFilter, setPositionFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roundFilter, setRoundFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('applied_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const [editing, setEditing] = useState<ApplicationRow | null>(null)
  const [exporting, setExporting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Filter dropdown sources — fetched once.
  const { data: positions } = useResource(() => getPositions(), [])
  const { data: departments } = useResource(getDepartments, [])
  const { data: rounds } = useResource(() => getHiringRounds(), [])

  const filters: ApplicationFilters = useMemo(
    () => ({
      applicant_type: activeTab,
      position_id: positionFilter === 'all' ? undefined : positionFilter,
      department_id: deptFilter === 'all' ? undefined : deptFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      hiring_round_id: roundFilter === 'all' ? undefined : roundFilter,
      search: searchTerm || undefined,
      sort_by: sortBy,
      sort_dir: sortDir,
      page,
      per_page: PER_PAGE,
    }),
    [activeTab, positionFilter, deptFilter, statusFilter, roundFilter, searchTerm, sortBy, sortDir, page],
  )

  const { data, loading, error, reload } = useResource(
    () => getApplications(filters),
    [activeTab, positionFilter, deptFilter, statusFilter, roundFilter, searchTerm, sortBy, sortDir, page],
  )

  const rows = data?.data ?? []
  const meta = data?.meta

  /** Any filter change invalidates the current page number. */
  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  async function handleExport() {
    setActionError(null)
    setExporting(true)
    try {
      // Same filters, minus pagination — the CSV is the whole filtered set.
      const { page: _page, per_page: _perPage, ...exportFilters } = filters
      await exportApplicants(exportFilters)
      setNotice('Export downloaded.')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Export failed.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Applicants"
        subtitle="Review and manage all applicant submissions"
        action={
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-60"
          >
            <FiDownload className="w-4 h-4" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        }
      />

      {notice && <SuccessBanner message={notice} onDismiss={() => setNotice(null)} />}
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}

      {/* Tabs */}
      <div className="border-b border-[#E2E8F0] mb-6">
        <div className="flex gap-0">
          {(['external', 'internal'] as ApplicantTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setPage(1)
              }}
              className={
                activeTab === tab
                  ? 'px-5 py-3 text-sm font-semibold text-[#2563EB] border-b-2 border-[#2563EB] -mb-px transition-colors'
                  : 'px-5 py-3 text-sm font-medium text-[#64748B] hover:text-[#1E293B] border-b-2 border-transparent -mb-px transition-colors'
              }
            >
              {tab === 'external' ? 'External Applicants' : 'Internal Staff'}
              {activeTab === tab && meta && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">
                  {meta.total}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-center shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSearchTerm(search.trim())
            setPage(1)
          }}
          className="relative"
        >
          <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-[#64748B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-56 pl-9 pr-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </form>

        <FilterSelect
          label="Position"
          value={positionFilter}
          onChange={withPageReset(setPositionFilter)}
          allLabel="All Positions"
          options={(positions ?? []).map((p) => ({ value: p.id, label: p.title }))}
        />

        <FilterSelect
          label="Department"
          value={deptFilter}
          onChange={withPageReset(setDeptFilter)}
          allLabel="All Departments"
          options={(departments ?? []).map((d) => ({ value: d.id, label: d.code }))}
        />

        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={withPageReset(setStatusFilter)}
          allLabel="All Statuses"
          options={[
            { value: 'applied', label: 'Applied' },
            { value: 'for_review', label: 'For Review' },
            { value: 'for_interview', label: 'For Interview' },
            { value: 'hired', label: 'Hired' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'withdrawn', label: 'Withdrawn' },
          ]}
        />

        <FilterSelect
          label="Round"
          value={roundFilter}
          onChange={withPageReset(setRoundFilter)}
          allLabel="All Rounds"
          options={(rounds ?? []).map((r) => ({ value: r.id, label: r.name }))}
        />

        <FilterSelect
          label="Sort"
          value={`${sortBy}:${sortDir}`}
          onChange={(value) => {
            const [by, dir] = value.split(':')
            setSortBy(by)
            setSortDir(dir as 'asc' | 'desc')
            setPage(1)
          }}
          options={[
            { value: 'applied_at:desc', label: 'Newest first' },
            { value: 'applied_at:asc', label: 'Oldest first' },
            { value: 'total_wsm_score:desc', label: 'Highest score' },
            { value: 'total_wsm_score:asc', label: 'Lowest score' },
          ]}
        />

        {meta && (
          <span className="ml-auto text-sm text-[#64748B]">
            {meta.total} result{meta.total !== 1 ? 's' : ''}
          </span>
        )}
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Dept</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide w-44">WSM Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applied</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                {loading ? (
                  <TableSkeleton rows={6} cols={7} />
                ) : (
                  <tbody>
                    {rows.map((app, idx) => {
                      const score = app.total_wsm_score === null ? null : Number(app.total_wsm_score)
                      return (
                        <tr
                          key={app.id}
                          className={
                            idx % 2 === 0
                              ? 'bg-white border-b border-[#F1F5F9]'
                              : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'
                          }
                        >
                          <td className="px-4 py-3.5">
                            <Link
                              href={`/admin/applicants/${app.id}`}
                              className="font-semibold text-[#1E293B] hover:text-[#2563EB] hover:underline"
                            >
                              {app.applicant?.full_name ?? '—'}
                            </Link>
                            <p className="text-xs text-[#94A3B8]">{app.applicant?.email ?? ''}</p>
                          </td>
                          <td className="px-4 py-3.5 text-[#64748B] text-xs">{app.position?.title ?? '—'}</td>
                          <td className="px-4 py-3.5 text-[#64748B] text-xs font-semibold">
                            {app.position?.department?.code ?? '—'}
                          </td>
                          <td className="px-4 py-3.5">
                            {score === null ? (
                              <span className="text-xs text-[#94A3B8]">Not scored</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[#1E293B] w-14">
                                  {formatScore(score)}
                                </span>
                                <div className="flex-1 bg-[#E2E8F0] rounded-full h-1.5 min-w-[40px]">
                                  <div
                                    className="bg-[#2563EB] h-1.5 rounded-full"
                                    style={{ width: `${Math.min(score * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={app.status} />
                          </td>
                          <td className="px-4 py-3.5 text-[#64748B] text-xs">{formatDate(app.applied_at)}</td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/admin/applicants/${app.id}`}
                                className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors"
                                title="View profile"
                              >
                                <FiEye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => setEditing(app)}
                                className="p-1.5 text-[#64748B] hover:text-[#D97706] hover:bg-amber-50 rounded-md transition-colors"
                                title="Update status"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <Link
                                href={`/admin/applicants/${app.id}#documents`}
                                className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors"
                                title="View documents"
                              >
                                <FiFileText className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                )}
              </table>
            </div>

            {!loading && rows.length === 0 && (
              <EmptyState
                title="No applicants match these filters"
                description="Try clearing a filter, or switch between the External and Internal tabs."
              />
            )}

            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFF]">
                <p className="text-xs text-[#64748B]">
                  Page {meta.current_page} of {meta.last_page}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.current_page <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 border border-[#E2E8F0] bg-white rounded-lg text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFF] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={meta.current_page >= meta.last_page}
                    className="flex items-center gap-1 px-3 py-1.5 border border-[#E2E8F0] bg-white rounded-lg text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFF] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                    <FiChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {editing && (
        <StatusUpdateModal
          applicationId={editing.id}
          applicantName={editing.applicant?.full_name ?? 'this applicant'}
          currentStatus={editing.status}
          onClose={() => setEditing(null)}
          onUpdated={(newStatus) => {
            setEditing(null)
            setNotice(`Status updated to ${newStatus.replace(/_/g, ' ')}.`)
            reload()
          }}
        />
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  allLabel?: string
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
          {allLabel && <option value="all">{allLabel}</option>}
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
