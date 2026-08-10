'use client'

import Link from 'next/link'
import {
  FiBriefcase,
  FiUsers,
  FiCheckCircle,
  FiClipboard,
  FiChevronRight,
} from 'react-icons/fi'
import StatCard from '@/components/director/StatCard'
import PageHeader from '@/components/director/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { CardSkeleton, EmptyState, ErrorState, TableSkeleton } from '@/components/shared/DataState'
import { getDashboardStats, getDepartments } from '@/lib/api/admin'
import { useAuth } from '@/lib/auth'
import { formatTimestamp } from '@/lib/format'
import { useResource } from '@/lib/useResource'

export default function DirectorDashboardPage() {
  const { user } = useAuth()

  const { data: stats, loading, error, reload } = useResource(getDashboardStats, [])
  const { data: departments } = useResource(getDepartments, [])

  // The departments endpoint is already scoped, so this is the director's own.
  const department = departments?.[0]
  const round = stats?.active_round

  return (
    <div className="p-8">
      <div className="mb-1 text-xs font-semibold text-[#2563EB] uppercase tracking-wider">
        Director View
      </div>
      <PageHeader
        title={department?.name ?? 'Department Overview'}
        subtitle={
          round
            ? `${round.name} — Read-only overview`
            : 'No active hiring round — read-only overview'
        }
      />

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
                  label="Open Positions"
                  value={stats.open_positions}
                  change="In your department"
                  iconBg="bg-blue-100"
                />
                <StatCard
                  icon={FiUsers}
                  label="Total Applicants"
                  value={stats.total_applicants}
                  change={`${stats.total_applications} application${stats.total_applications === 1 ? '' : 's'}`}
                  iconBg="bg-indigo-100"
                />
                <StatCard
                  icon={FiCheckCircle}
                  label="Hired This Round"
                  value={stats.hired_count}
                  change={`${stats.filled_slots} of ${stats.total_slots} slots filled`}
                  changeType="positive"
                  iconBg="bg-green-100"
                />
                <StatCard
                  icon={FiClipboard}
                  label="Pending Reviews"
                  value={stats.pending_reviews}
                  change={stats.pending_reviews > 0 ? 'Awaiting committee' : 'Nothing pending'}
                  iconBg="bg-amber-100"
                />
              </>
            )}
          </div>

          {/* Two-column content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#1E293B]">Recent Department Activity</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Latest status changes for {department?.code ?? 'your department'} applicants
                  </p>
                </div>
                <Link
                  href="/director/positions"
                  className="text-sm text-[#2563EB] hover:underline flex items-center gap-1 font-medium"
                >
                  View positions <FiChevronRight className="w-3.5 h-3.5" />
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
                                href={`/director/applicants/${item.application_id}`}
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
                              {item.previous_status && (
                                <>
                                  <StatusBadge status={item.previous_status} />
                                  <span className="text-[#64748B] text-xs">→</span>
                                </>
                              )}
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
                    description="Status changes on applications in your department will appear here."
                  />
                )}
              </div>
            </div>

            {/* Department Summary */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
              <h2 className="text-base font-semibold text-[#1E293B] mb-5">Department Overview</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Department</p>
                  <p className="text-sm font-semibold text-[#1E293B]">{department?.name ?? '—'}</p>
                  <p className="text-xs text-[#64748B]">Code: {department?.code ?? '—'}</p>
                </div>

                <div className="border-t border-[#E2E8F0] pt-4">
                  <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Director</p>
                  <p className="text-sm font-semibold text-[#1E293B]">
                    {user ? `${user.first_name} ${user.last_name}` : '—'}
                  </p>
                  <p className="text-xs text-[#64748B]">{user?.email ?? ''}</p>
                </div>

                <div className="border-t border-[#E2E8F0] pt-4">
                  <p className="text-xs text-[#64748B] uppercase tracking-wide mb-2">At a Glance</p>
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
                    <GlanceRow
                      label="Scored applications"
                      value={stats?.scored_count}
                      loading={loading}
                    />
                    <GlanceRow label="Pool members" value={stats?.pool_members} loading={loading} />
                  </ul>
                </div>

                <div className="border-t border-[#E2E8F0] pt-4">
                  <p className="text-xs text-[#64748B]">
                    You have read-only access. Status changes, scoring and assignment runs are
                    performed by HR.
                  </p>
                </div>
              </div>
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
