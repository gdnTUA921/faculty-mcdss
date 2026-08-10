'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  FiPlay,
  FiX,
  FiChevronDown,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import {
  EmptyState,
  ErrorBanner,
  ErrorState,
  Spinner,
  SuccessBanner,
  TableSkeleton,
} from '@/components/shared/DataState'
import { ApiError } from '@/lib/api/client'
import {
  createAssignmentRun,
  getAssignmentRun,
  getAssignmentRuns,
  getDepartments,
  getHiringRounds,
  getPositions,
} from '@/lib/api/admin'
import { formatDateTime, formatScore, fullName } from '@/lib/format'
import { useResource } from '@/lib/useResource'

export default function AssignmentPage() {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [applicantType, setApplicantType] = useState<'both' | 'external' | 'internal'>('both')
  const [roundId, setRoundId] = useState('')
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [showDeptDropdown, setShowDeptDropdown] = useState(false)
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)

  const { data: departments } = useResource(getDepartments, [])
  const { data: rounds } = useResource(() => getHiringRounds(), [])
  const { data: positions } = useResource(() => getPositions({ status: 'open' }), [])

  const { data: runs, loading: runsLoading, error: runsError, reload: reloadRuns } = useResource(
    () => getAssignmentRuns({ limit: 10 }),
    [],
  )

  // Default the round picker to the active round once rounds arrive.
  useEffect(() => {
    if (roundId || !rounds?.length) return
    const active = rounds.find((r) => r.status === 'active')
    setRoundId(active?.id ?? rounds[0].id)
  }, [rounds, roundId])

  // Show the newest run by default.
  useEffect(() => {
    if (selectedRunId || !runs?.length) return
    setSelectedRunId(runs[0].id)
  }, [runs, selectedRunId])

  const { data: run, loading: runLoading } = useResource(
    () => (selectedRunId ? getAssignmentRun(selectedRunId) : Promise.resolve(null)),
    [selectedRunId],
  )

  const latest = runs?.[0]

  async function handleRunConfirm() {
    if (!roundId) return
    setActionError(null)
    setRunning(true)

    try {
      const result = await createAssignmentRun({
        hiring_round_id: roundId,
        scope_applicant_type: applicantType,
        // Omit empty arrays so the solver treats the scope as unrestricted.
        ...(selectedDepts.length ? { scope_department_ids: selectedDepts } : {}),
        ...(selectedPositions.length ? { scope_position_ids: selectedPositions } : {}),
      })
      setShowConfirmModal(false)
      setNotice(result.message ?? 'Assignment run completed.')
      setSelectedRunId(result.assignment_run?.id ?? null)
      reloadRuns()
    } catch (err) {
      setShowConfirmModal(false)
      if (err instanceof ApiError) {
        setActionError(
          err.status === 502
            ? 'The solver could not complete this run. Check that scored applications exist in the selected scope.'
            : (Object.values(err.errors)[0]?.[0] ?? err.message),
        )
      } else {
        setActionError('Could not start the assignment run.')
      }
    } finally {
      setRunning(false)
    }
  }

  function toggleDept(id: string) {
    setSelectedDepts((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]))
  }

  const deptOptions = departments ?? []
  const results = run?.results ?? []
  const assignedCount = results.filter((r) => r.is_assigned).length

  return (
    <div className="p-8">
      <PageHeader title="Assignment" subtitle="ILP-Based Candidate Selection & Faculty Allocation" />

      {notice && <SuccessBanner message={notice} onDismiss={() => setNotice(null)} />}
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}

      {/* Section 1 — Configure & Run */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-[#1E293B] mb-4">Configure &amp; Run Assignment</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <div>
            <label htmlFor="round" className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              Hiring Round <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="round"
                value={roundId}
                onChange={(e) => setRoundId(e.target.value)}
                className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white"
              >
                {(rounds ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.status === 'active' ? ' (active)' : ''}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="type" className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              Applicant Type
            </label>
            <div className="relative">
              <select
                id="type"
                value={applicantType}
                onChange={(e) => setApplicantType(e.target.value as typeof applicantType)}
                className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white"
              >
                <option value="both">Both (External + Internal)</option>
                <option value="external">External Only</option>
                <option value="internal">Internal Only</option>
              </select>
              <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              Departments
            </label>
            <button
              type="button"
              onClick={() => setShowDeptDropdown(!showDeptDropdown)}
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
            >
              <span>
                {selectedDepts.length === 0 ? 'All Departments' : `${selectedDepts.length} selected`}
              </span>
              <FiChevronDown className="w-4 h-4 text-[#64748B]" />
            </button>
            {showDeptDropdown && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-3 w-60 space-y-1.5">
                {deptOptions.map((d) => (
                  <label
                    key={d.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDepts.includes(d.id)}
                      onChange={() => toggleDept(d.id)}
                      className="w-3.5 h-3.5 accent-[#2563EB]"
                    />
                    <span className="text-sm text-[#1E293B]">{d.code}</span>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedDepts([])}
                  className="w-full mt-1 text-xs text-[#64748B] font-medium text-left px-2 py-1 hover:bg-gray-50 rounded-md"
                >
                  Clear (use all)
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeptDropdown(false)}
                  className="w-full text-xs text-[#2563EB] font-semibold text-left px-2 py-1 hover:bg-blue-50 rounded-md"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="pos" className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              Positions
            </label>
            <div className="relative">
              <select
                id="pos"
                value={selectedPositions[0] ?? ''}
                onChange={(e) => setSelectedPositions(e.target.value ? [e.target.value] : [])}
                className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white"
              >
                <option value="">All Open Positions ({(positions ?? []).length})</option>
                {(positions ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.department?.code ?? ''}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Last run status */}
        <div className="flex flex-wrap items-center gap-4 mb-5 p-3 bg-[#F8FAFF] rounded-lg border border-[#E2E8F0]">
          {runsLoading ? (
            <span className="text-sm text-[#64748B]">Loading run history…</span>
          ) : latest ? (
            <>
              <div className="flex items-center gap-2">
                {latest.status === 'completed' ? (
                  <FiCheckCircle className="w-4 h-4 text-[#16A34A]" />
                ) : (
                  <FiAlertCircle className="w-4 h-4 text-[#DC2626]" />
                )}
                <span className="text-sm text-[#64748B]">Last run:</span>
                <StatusBadge status={latest.status} />
              </div>
              <span className="text-sm text-[#64748B]">{formatDateTime(latest.run_at)}</span>
              <span className="text-sm text-[#64748B]">
                Objective Score:{' '}
                <span className="font-semibold text-[#1E293B]">
                  {formatScore(latest.result_summary?.objective_score)}
                </span>
              </span>
              {latest.run_by && (
                <span className="text-sm text-[#64748B]">
                  by <span className="font-semibold text-[#1E293B]">{latest.run_by}</span>
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-[#64748B]">No assignment runs yet.</span>
          )}
        </div>

        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={!roundId || running}
          className="flex items-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <FiPlay className="w-4 h-4" />
          {running ? 'Running solver…' : 'Run Assignment Algorithm'}
        </button>
      </div>

      {/* Section 2 — Results */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-[#1E293B]">Assignment Results</h2>
          {(runs ?? []).length > 1 && (
            <div className="relative ml-auto">
              <select
                value={selectedRunId ?? ''}
                onChange={(e) => setSelectedRunId(e.target.value)}
                className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-xs text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {(runs ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {formatDateTime(r.run_at)} — {r.status}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-[#64748B] pointer-events-none" />
            </div>
          )}
        </div>

        {runsError ? (
          <ErrorState message={runsError} onRetry={reloadRuns} />
        ) : runLoading ? (
          <Spinner label="Loading results…" />
        ) : !run ? (
          <EmptyState
            title="No assignment run to show"
            description="Configure a scope above and run the solver to see optimal assignments."
          />
        ) : (
          <>
            <div className="px-6 py-3 bg-[#F8FAFF] border-b border-[#E2E8F0] flex flex-wrap gap-6 text-sm items-center">
              <StatusBadge status={run.status} />
              <span className="text-[#64748B]">
                <span className="font-bold text-[#16A34A]">{assignedCount}</span> applicants assigned
              </span>
              <span className="text-[#64748B]">
                <span className="font-bold text-[#2563EB]">{results.length}</span> candidates evaluated
              </span>
              <span className="text-[#64748B]">
                Objective Score:{' '}
                <span className="font-bold text-[#1E293B]">
                  {formatScore(run.result_summary?.objective_score)}
                </span>
              </span>
              <span className="text-[#64748B] text-xs">
                Scope: {run.scope_applicant_type ?? 'both'}
              </span>
            </div>

            {run.status === 'failed' && run.result_summary?.error && (
              <div className="px-6 py-4">
                <ErrorBanner message={run.result_summary.error} />
              </div>
            )}

            {results.length === 0 ? (
              <EmptyState
                title="This run produced no results"
                description="The solver found no eligible scored applications in the selected scope."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applicant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Dept</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">WSM Score</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Assigned</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Objective Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => {
                      const user = r.application?.applicant_profile?.user
                      return (
                        <tr
                          key={r.id}
                          className={
                            idx % 2 === 0
                              ? 'bg-white border-b border-[#F1F5F9]'
                              : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'
                          }
                        >
                          <td className="px-6 py-3.5">
                            <Link
                              href={`/admin/applicants/${r.application_id}`}
                              className="font-semibold text-[#1E293B] hover:text-[#2563EB] hover:underline"
                            >
                              {fullName(user?.first_name, user?.last_name)}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 text-[#64748B] text-xs">{r.position?.title ?? '—'}</td>
                          <td className="px-4 py-3.5 text-[#64748B] text-xs font-semibold">
                            {r.position?.department?.code ?? '—'}
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
          </>
        )}
      </div>

      {/* Section 3 — Faculty Workload */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-semibold text-[#1E293B]">Faculty Workload Allocation</h2>
        </div>
        <div className="px-6 py-8 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FiInfo className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">Not available through the API yet</p>
            <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
              Faculty course-load allocation is solved by the FastAPI workload endpoint and stored in{' '}
              <code className="text-xs bg-[#F1F5F9] px-1.5 py-0.5 rounded">faculty_workload</code>, but
              Laravel does not expose a route for it. Run the internal-applicant scope above to allocate
              teaching load; the results table shows those assignments.
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-lg font-bold text-[#1E293B]">Confirm Assignment Run</h2>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-[#64748B] hover:text-[#1E293B] p-1 rounded-md hover:bg-gray-100"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">Please confirm before proceeding</p>
                <p className="text-sm text-amber-700">
                  This runs the ILP solver for <strong>{applicantType}</strong> applicants and records a
                  new assignment run. Only applications with a WSM score are considered.
                </p>
              </div>
              <div className="space-y-2 text-sm text-[#64748B]">
                <div className="flex justify-between gap-4">
                  <span>Hiring round:</span>
                  <span className="font-semibold text-[#1E293B] text-right">
                    {rounds?.find((r) => r.id === roundId)?.name ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Departments:</span>
                  <span className="font-semibold text-[#1E293B] text-right">
                    {selectedDepts.length === 0
                      ? 'All'
                      : deptOptions
                          .filter((d) => selectedDepts.includes(d.id))
                          .map((d) => d.code)
                          .join(', ')}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Positions:</span>
                  <span className="font-semibold text-[#1E293B] text-right">
                    {selectedPositions.length === 0
                      ? 'All open positions'
                      : (positions ?? []).find((p) => p.id === selectedPositions[0])?.title ?? '1 selected'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-gray-50">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 border border-[#E2E8F0] text-[#64748B] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunConfirm}
                disabled={running}
                className="flex-1 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {running ? 'Running…' : 'Confirm & Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
