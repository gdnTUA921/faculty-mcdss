'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FiArrowLeft, FiEye, FiCalendar, FiBriefcase, FiUsers, FiSliders } from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import { EmptyState, ErrorState, Spinner } from '@/components/shared/DataState'
import { getCriteria, getPosition, getRankings } from '@/lib/api/admin'
import { formatDate, formatScore, fullName } from '@/lib/format'
import { useResource } from '@/lib/useResource'

export default function PositionDetailPage() {
  const params = useParams<{ id: string }>()
  const positionId = params.id

  const { data: position, loading, error, reload } = useResource(
    () => getPosition(positionId),
    [positionId],
  )
  const { data: criteria } = useResource(() => getCriteria(positionId), [positionId])
  const { data: rankings } = useResource(() => getRankings(positionId), [positionId])

  if (loading) return <Spinner label="Loading position…" />

  if (error || !position) {
    return (
      <div className="p-8">
        <BackLink />
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <ErrorState
            message={error ?? 'This position is not in your department.'}
            onRetry={reload}
          />
        </div>
      </div>
    )
  }

  const criteriaRows = criteria ?? []
  const rankingRows = rankings ?? []
  const totalWeight = criteriaRows.reduce((sum, c) => sum + Number(c.weight), 0)

  return (
    <div className="p-8">
      <BackLink />

      {/* Position Header Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={position.status} />
              <StatusBadge status={position.target_applicant_type} />
            </div>
            <h1 className="text-2xl font-bold text-[#1E293B] mb-1 tracking-tight">
              {position.title}
            </h1>
            <p className="text-sm text-[#64748B]">{position.department?.name ?? '—'}</p>
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Slots Filled</p>
              <p className="text-lg font-bold text-[#1E293B]">
                {position.slots_filled}
                <span className="text-[#64748B] font-normal"> / {position.slots_available}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Deadline</p>
              <div className="flex items-center gap-1.5 text-[#1E293B]">
                <FiCalendar className="w-4 h-4 text-[#64748B]" />
                <p className="font-semibold">{formatDate(position.application_deadline)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Applications</p>
              <p className="text-lg font-bold text-[#1E293B]">{position.applications_count ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FiBriefcase className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-base font-semibold text-[#1E293B]">Position Description</h2>
        </div>
        <p className="text-sm text-[#1E293B] leading-relaxed">
          {position.description || 'No description provided.'}
        </p>
      </div>

      {/* Criteria & Weights */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FiSliders className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-base font-semibold text-[#1E293B]">Evaluation Criteria</h2>
            <span className="text-xs text-[#64748B]">({criteriaRows.length})</span>
          </div>
          <p className="text-xs text-[#64748B]">
            Total weight: <span className="font-semibold">{(totalWeight * 100).toFixed(0)}%</span>
          </p>
        </div>

        {criteriaRows.length === 0 ? (
          <EmptyState
            title="No criteria configured"
            description="HR has not yet set up this position's evaluation criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Criterion</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide w-48">Weight</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Range</th>
                </tr>
              </thead>
              <tbody>
                {criteriaRows.map((c, idx) => {
                  const pct = Math.round(Number(c.weight) * 100)
                  return (
                    <tr key={c.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}>
                      <td className="px-6 py-3">
                        <p className="font-semibold text-[#1E293B]">{c.name}</p>
                        {c.description && (
                          <p className="text-xs text-[#64748B] mt-0.5">{c.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.data_type} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#1E293B] w-10 text-right">
                            {pct}%
                          </span>
                          <div className="flex-1 bg-[#E2E8F0] rounded-full h-2 min-w-[70px]">
                            <div
                              className="bg-[#2563EB] h-2 rounded-full"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#64748B] text-xs">
                        {c.min_value !== null && c.max_value !== null
                          ? `${Number(c.min_value)} – ${Number(c.max_value)}`
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ranked Applicants */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FiUsers className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-base font-semibold text-[#1E293B]">Ranked Applicants</h2>
            <span className="text-xs text-[#64748B]">({rankingRows.length})</span>
          </div>
          <p className="text-xs text-[#64748B]">Sorted by WSM Score</p>
        </div>

        {rankingRows.length === 0 ? (
          <EmptyState
            title="No ranked applicants yet"
            description="Rankings appear once applications are submitted and HR has run scoring."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applicant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">WSM Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rankingRows.map((row, idx) => {
                  const score = row.total_wsm_score === null ? null : Number(row.total_wsm_score)
                  return (
                    <tr key={row.application_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}>
                      <td className="px-6 py-3">
                        <div
                          className={`w-7 h-7 rounded-full ${
                            idx === 0 ? 'bg-[#2563EB] text-white' : 'bg-[#DBEAFE] text-[#1E3A8A]'
                          } flex items-center justify-center text-xs font-bold`}
                        >
                          {row.rank_in_position ?? idx + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/director/applicants/${row.application_id}`}
                          className="font-semibold text-[#1E293B] hover:text-[#2563EB]"
                        >
                          {row.applicant_name ?? fullName(row.first_name, row.last_name)}
                        </Link>
                        {row.email && <p className="text-xs text-[#94A3B8]">{row.email}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {row.applicant_type ? <StatusBadge status={row.applicant_type} /> : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {score === null ? (
                          <span className="text-xs text-[#94A3B8]">Not scored</span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-semibold text-[#1E293B] text-xs">
                              {formatScore(score)}
                            </span>
                            <div className="w-24 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#2563EB] rounded-full"
                                style={{ width: `${Math.min(score * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#64748B] font-mono">
                              {(score * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/director/applicants/${row.application_id}`}
                          className="inline-flex items-center gap-1.5 text-[#2563EB] hover:text-[#1E3A8A] text-xs font-semibold"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/director/positions"
      className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] mb-4"
    >
      <FiArrowLeft className="w-4 h-4" />
      Back to Positions
    </Link>
  )
}
