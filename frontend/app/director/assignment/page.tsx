'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FiCheckCircle, FiTarget, FiInfo, FiAlertCircle, FiChevronDown } from 'react-icons/fi'
import PageHeader from '@/components/director/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { EmptyState, ErrorState, Spinner } from '@/components/shared/DataState'
import { getAssignmentRun, getAssignmentRuns, getDepartments } from '@/lib/api/admin'
import { formatDateTime, formatScore, fullName } from '@/lib/format'
import { useResource } from '@/lib/useResource'

export default function AssignmentResultsPage() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)

  const { data: departments } = useResource(getDepartments, [])
  const { data: runs, loading: runsLoading, error: runsError, reload } = useResource(
    () => getAssignmentRuns({ limit: 10 }),
    [],
  )

  useEffect(() => {
    if (selectedRunId || !runs?.length) return
    setSelectedRunId(runs[0].id)
  }, [runs, selectedRunId])

  const { data: run, loading: runLoading } = useResource(
    () => (selectedRunId ? getAssignmentRun(selectedRunId) : Promise.resolve(null)),
    [selectedRunId],
  )

  const department = departments?.[0]

  // Assignment runs are system-wide; a director should only see rows for their
  // own department, so narrow the results client-side.
  const allResults = run?.results ?? []
  const results = department
    ? allResults.filter((r) => r.position?.department?.id === department.id)
    : allResults
  const assignedCount = results.filter((r) => r.is_assigned).length

  return (
    <div className="p-8">
      <PageHeader
        title="Assignment Results"
        subtitle={`ILP-based candidate selection for ${department?.name ?? 'your department'}`}
      />

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
        <FiInfo className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
        <div className="text-xs text-[#1E3A8A]">
          <p className="font-semibold">Read-only assignment results</p>
          <p className="text-[#64748B] mt-0.5">
            Only rows for {department?.code ?? 'your department'} are shown. Configuring or
            triggering runs is restricted to HR Personnel.
          </p>
        </div>
      </div>

      {runsError ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <ErrorState message={runsError} onRetry={reload} />
        </div>
      ) : runsLoading ? (
        <Spinner label="Loading assignment runs…" />
      ) : !runs || runs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <EmptyState
            title="No assignment runs yet"
            description="Once HR runs the optimiser, the outcomes for your department appear here."
          />
        </div>
      ) : (
        <>
          {/* Run summary card */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    run?.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  {run?.status === 'completed' ? (
                    <FiCheckCircle className="w-6 h-6 text-[#16A34A]" />
                  ) : (
                    <FiAlertCircle className="w-6 h-6 text-[#DC2626]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-base font-semibold text-[#1E293B]">Latest Run</h2>
                    {run && <StatusBadge status={run.status} />}
                  </div>
                  <p className="text-xs text-[#64748B]">
                    {run ? formatDateTime(run.run_at) : '—'}
                    {run?.runner
                      ? ` · run by ${fullName(run.runner.first_name, run.runner.last_name)}`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">
                    Assigned (your dept)
                  </p>
                  <p className="text-lg font-bold text-[#16A34A]">{assignedCount}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Objective Score</p>
                  <p className="text-lg font-bold text-[#1E293B]">
                    {formatScore(run?.result_summary?.objective_score)}
                  </p>
                </div>
                {runs.length > 1 && (
                  <div className="relative">
                    <select
                      value={selectedRunId ?? ''}
                      onChange={(e) => setSelectedRunId(e.target.value)}
                      className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-xs text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      {runs.map((r) => (
                        <option key={r.id} value={r.id}>
                          {formatDateTime(r.run_at)} — {r.status}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-[#64748B] pointer-events-none" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
              <FiTarget className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-base font-semibold text-[#1E293B]">Candidate Assignments</h2>
              <span className="text-xs text-[#64748B]">({results.length})</span>
            </div>

            {runLoading ? (
              <Spinner label="Loading results…" />
            ) : results.length === 0 ? (
              <EmptyState
                title="No results for your department in this run"
                description="This run's scope did not include any of your department's positions."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applicant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">WSM Score</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Assigned</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Objective Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => {
                      const user = r.application?.applicant_profile?.user
                      return (
                        <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}>
                          <td className="px-6 py-3.5">
                            <Link
                              href={`/director/applicants/${r.application_id}`}
                              className="font-semibold text-[#1E293B] hover:text-[#2563EB] hover:underline"
                            >
                              {fullName(user?.first_name, user?.last_name)}
                            </Link>
                            {user?.email && <p className="text-xs text-[#94A3B8]">{user.email}</p>}
                          </td>
                          <td className="px-4 py-3.5 text-[#64748B] text-xs">
                            {r.position?.title ?? '—'}
                          </td>
                          <td className="px-4 py-3.5">
                            {r.application?.applicant_profile?.applicant_type ? (
                              <StatusBadge status={r.application.applicant_profile.applicant_type} />
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-[#2563EB] text-xs">
                            {formatScore(r.application?.total_wsm_score)}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={r.is_assigned ? 'yes' : 'no'} />
                          </td>
                          <td className="px-4 py-3.5 text-[#1E293B] font-mono text-xs">
                            {formatScore(r.objective_score)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
