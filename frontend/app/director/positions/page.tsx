'use client'

import Link from 'next/link'
import { FiEye, FiCalendar } from 'react-icons/fi'
import PageHeader from '@/components/director/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/DataState'
import { getDepartments, getHiringRounds, getPositions } from '@/lib/api/admin'
import { formatDate } from '@/lib/format'
import { useResource } from '@/lib/useResource'

export default function PositionsPage() {
  const { data: positions, loading, error, reload } = useResource(() => getPositions(), [])
  const { data: departments } = useResource(getDepartments, [])
  const { data: rounds } = useResource(() => getHiringRounds('active'), [])

  const department = departments?.[0]
  const activeRound = rounds?.[0]
  const rows = positions ?? []

  return (
    <div className="p-8">
      <PageHeader
        title="Positions"
        subtitle={`All positions in ${department?.name ?? 'your department'} — Read-only`}
      />

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
        <FiCalendar className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
        <div className="text-xs text-[#1E3A8A]">
          <p className="font-semibold">
            Active Hiring Round: {activeRound?.name ?? 'None configured'}
          </p>
          <p className="text-[#64748B] mt-0.5">
            As an Academic Director, you may view positions, criteria and rankings but cannot create
            or modify them.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Target Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Slots</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applicants</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Deadline</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                {loading ? (
                  <TableSkeleton rows={5} cols={7} />
                ) : (
                  <tbody>
                    {rows.map((pos, idx) => (
                      <tr key={pos.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}>
                        <td className="px-6 py-3">
                          <Link
                            href={`/director/positions/${pos.id}`}
                            className="font-semibold text-[#1E293B] hover:text-[#2563EB]"
                          >
                            {pos.title}
                          </Link>
                          <p className="text-xs text-[#64748B] mt-0.5">
                            {pos.criteria_count ?? 0} criteria
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={pos.target_applicant_type} />
                        </td>
                        <td className="px-4 py-3 text-[#1E293B]">
                          <span className="font-semibold">{pos.slots_filled}</span>
                          <span className="text-[#64748B]"> / {pos.slots_available}</span>
                        </td>
                        <td className="px-4 py-3 text-[#1E293B] font-semibold">
                          {pos.applications_count ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={pos.status} />
                        </td>
                        <td className="px-4 py-3 text-[#64748B] text-xs">
                          {formatDate(pos.application_deadline)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/director/positions/${pos.id}`}
                            className="inline-flex items-center gap-1.5 text-[#2563EB] hover:text-[#1E3A8A] text-xs font-semibold"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
            {!loading && rows.length === 0 && (
              <EmptyState
                title="No positions in your department"
                description="Positions HR creates for your department will appear here."
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
