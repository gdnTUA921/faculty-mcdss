'use client'

import Link from 'next/link'
import {
  FiBriefcase,
  FiUsers,
  FiClipboard,
  FiCalendar,
  FiPlus,
  FiPlayCircle,
  FiSliders,
  FiChevronRight,
} from 'react-icons/fi'
import StatCard from '@/components/admin/StatCard'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { CardSkeleton, EmptyState, ErrorState, TableSkeleton } from '@/components/shared/DataState'
import { getDashboardStats } from '@/lib/api/admin'
import { formatDate, formatTimestamp } from '@/lib/format'
import { useResource } from '@/lib/useResource'

export default function DashboardPage() {
  const { data: stats, loading, error, reload } = useResource(getDashboardStats)

  const round = stats?.active_round
  const roundLabel = round
    ? `${round.name}`
    : loading
      ? 'Loading…'
      : 'No active hiring round'

  return (
    <div className="p-8">
      <PageHeader title="Dashboard" subtitle={roundLabel} />

      {error && <ErrorState message={error} onRetry={reload} />}

      {!error && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {loading || !stats ? (
              <CardSkeleton count={4} />
            ) : (
              <>
                <StatCard
                  icon={FiBriefcase}
                  label="Total Open Positions"
                  value={stats.open_positions}
                  change={`${stats.total_positions} total · ${stats.total_slots} slots`}
                  changeType="neutral"
                  iconBg="bg-blue-100"
                />
                <StatCard
                  icon={FiUsers}
                  label="Total Applicants"
                  value={stats.total_applicants}
                  change={`${stats.total_applications} application${stats.total_applications === 1 ? '' : 's'}`}
                  changeType="neutral"
                  iconBg="bg-indigo-100"
                />
                <StatCard
                  icon={FiClipboard}
                  label="Pending Reviews"
                  value={stats.pending_reviews}
                  change={stats.pending_reviews > 0 ? 'Awaiting action' : 'Nothing pending'}
                  changeType="neutral"
                  iconBg="bg-amber-100"
                />
                <StatCard
                  icon={FiCalendar}
                  label="Active Round"
                  value={round ? `AY ${round.academic_year} ${round.semester}` : '—'}
                  change={round?.end_date ? `Ends ${formatDate(round.end_date)}` : 'No end date set'}
                  changeType="neutral"
                  iconBg="bg-green-100"
                />
              </>
            )}
          </div>

          {/* Two-column content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Activity Table */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#1E293B]">Recent Activity</h2>
                <Link
                  href="/admin/applicants"
                  className="text-sm text-[#2563EB] hover:underline flex items-center gap-1 font-medium"
                >
                  View all <FiChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applicant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status Change</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">When</th>
                    </tr>
                  </thead>
                  {loading ? (
                    <TableSkeleton rows={5} cols={4} />
                  ) : (
                    <tbody>
                      {(stats?.recent_activity ?? []).map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}>
                          <td className="px-6 py-3 font-medium text-[#1E293B]">
                            {item.application_id ? (
                              <Link
                                href={`/admin/applicants/${item.application_id}`}
                                className="hover:text-[#2563EB] hover:underline"
                              >
                                {item.applicant_name ?? '—'}
                              </Link>
                            ) : (
                              item.applicant_name ?? '—'
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#64748B] text-xs">{item.position ?? '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.previous_status && <StatusBadge status={item.previous_status} />}
                              {item.previous_status && <span className="text-[#64748B] text-xs">→</span>}
                              <StatusBadge status={item.new_status} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#64748B] text-xs whitespace-nowrap">
                            {formatTimestamp(item.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  )}
                </table>
                {!loading && (stats?.recent_activity.length ?? 0) === 0 && (
                  <EmptyState
                    title="No activity yet"
                    description="Status changes on applications will appear here."
                  />
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
              <h2 className="text-base font-semibold text-[#1E293B] mb-5">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/admin/positions"
                  className="flex items-center gap-3 w-full bg-[#2563EB] text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Create Position</span>
                </Link>
                <Link
                  href="/admin/hiring-rounds"
                  className="flex items-center gap-3 w-full border border-[#2563EB] text-[#2563EB] px-4 py-3 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
                >
                  <FiPlayCircle className="w-4 h-4" />
                  <span>Start New Round</span>
                </Link>
                <Link
                  href="/admin/assignment"
                  className="flex items-center gap-3 w-full border border-[#2563EB] text-[#2563EB] px-4 py-3 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
                >
                  <FiSliders className="w-4 h-4" />
                  <span>Run Assignment</span>
                </Link>
              </div>

              <div className="border-t border-[#E2E8F0] my-5" />

              <h3 className="text-sm font-semibold text-[#1E293B] mb-3">At a Glance</h3>
              <ul className="space-y-2">
                <GlanceRow
                  label="Applicants for interview"
                  value={stats?.applications_by_status.for_interview}
                  loading={loading}
                />
                <GlanceRow
                  label="Applicants for review"
                  value={stats?.applications_by_status.for_review}
                  loading={loading}
                />
                <GlanceRow
                  label="Hired this round"
                  value={stats?.hired_count}
                  loading={loading}
                  emphasis
                />
                <GlanceRow label="Scored applications" value={stats?.scored_count} loading={loading} />
                <GlanceRow label="Pool members" value={stats?.pool_members} loading={loading} />
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function GlanceRow({
  label,
  value,
  loading,
  emphasis,
}: {
  label: string
  value: number | undefined
  loading: boolean
  emphasis?: boolean
}) {
  return (
    <li className="flex justify-between text-sm">
      <span className="text-[#64748B]">{label}</span>
      {loading ? (
        <span className="h-4 w-6 bg-[#E2E8F0] rounded animate-pulse" />
      ) : (
        <span className={`font-semibold ${emphasis ? 'text-[#16A34A]' : 'text-[#1E293B]'}`}>
          {value ?? 0}
        </span>
      )}
    </li>
  )
}
