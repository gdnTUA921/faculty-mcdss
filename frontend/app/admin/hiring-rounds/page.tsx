'use client'

import { useState } from 'react'
import { FiPlus, FiX, FiArchive, FiChevronDown, FiUsers, FiEdit2, FiAlertTriangle } from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { EmptyState, ErrorBanner, ErrorState, SuccessBanner, TableSkeleton } from '@/components/shared/DataState'
import { ApiError } from '@/lib/api/client'
import {
  archiveHiringRound,
  closeHiringRound,
  createHiringRound,
  getHiringRounds,
  updateHiringRound,
} from '@/lib/api/admin'
import { formatDate } from '@/lib/format'
import { useResource } from '@/lib/useResource'
import type { HiringRound } from '@/lib/types'

export default function HiringRoundsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<HiringRound | null>(null)
  const [confirmClose, setConfirmClose] = useState<HiringRound | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data: rounds, loading, error, reload } = useResource(() => getHiringRounds(), [])

  async function handleArchive(round: HiringRound) {
    setActionError(null)
    setBusyId(round.id)
    try {
      const result = await archiveHiringRound(round.id)
      setNotice(result.message ?? `"${round.name}" archived.`)
      reload()
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? (Object.values(err.errors)[0]?.[0] ?? err.message)
          : 'Could not archive the round.',
      )
    } finally {
      setBusyId(null)
    }
  }

  async function handleClose(round: HiringRound) {
    setActionError(null)
    setBusyId(round.id)
    try {
      const result = await closeHiringRound(round.id)
      setNotice(result.message ?? `"${round.name}" closed.`)
      setConfirmClose(null)
      reload()
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? (Object.values(err.errors)[0]?.[0] ?? err.message)
          : 'Could not close the round.',
      )
      setConfirmClose(null)
    } finally {
      setBusyId(null)
    }
  }

  const rows = rounds ?? []

  return (
    <div className="p-8">
      <PageHeader
        title="Hiring Rounds"
        subtitle="Manage academic hiring rounds by semester"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Create Round
          </button>
        }
      />

      {notice && <SuccessBanner message={notice} onDismiss={() => setNotice(null)} />}
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Round Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Semester</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Academic Year</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Start Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">End Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applications</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                {loading ? (
                  <TableSkeleton rows={4} cols={8} />
                ) : (
                  <tbody>
                    {rows.map((round, idx) => (
                      <tr
                        key={round.id}
                        className={
                          idx % 2 === 0
                            ? 'bg-white border-b border-[#F1F5F9]'
                            : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'
                        }
                      >
                        <td className="px-6 py-4 font-semibold text-[#1E293B]">{round.name}</td>
                        <td className="px-4 py-4 text-[#64748B]">{round.semester}</td>
                        <td className="px-4 py-4 text-[#64748B]">{round.academic_year}</td>
                        <td className="px-4 py-4 text-[#64748B] text-xs">{formatDate(round.start_date)}</td>
                        <td className="px-4 py-4 text-[#64748B] text-xs">{formatDate(round.end_date)}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E293B]">
                            <FiUsers className="w-3.5 h-3.5 text-[#94A3B8]" />
                            {round.applications_count}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={round.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {round.status === 'active' && (
                              <button
                                onClick={() => setEditing(round)}
                                disabled={busyId === round.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-gray-100 rounded-lg border border-[#E2E8F0] transition-colors disabled:opacity-50"
                                title="Edit round details"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                            )}
                            {round.status === 'active' && (
                              <button
                                onClick={() => setConfirmClose(round)}
                                disabled={busyId === round.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-red-50 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                                title="Close round and move unhired applicants to the pool"
                              >
                                <FiX className="w-3.5 h-3.5" />
                                Close Round
                              </button>
                            )}
                            {round.status === 'closed' && (
                              <button
                                onClick={() => handleArchive(round)}
                                disabled={busyId === round.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-gray-100 rounded-lg border border-[#E2E8F0] transition-colors disabled:opacity-50"
                                title="Archive round"
                              >
                                <FiArchive className="w-3.5 h-3.5" />
                                Archive
                              </button>
                            )}
                            {round.status === 'archived' && (
                              <span className="text-xs text-[#94A3B8]">No actions</span>
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
                title="No hiring rounds yet"
                description="Applications attach to the latest active round, so create one before opening positions."
                action={
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    <FiPlus className="w-4 h-4" />
                    Create Round
                  </button>
                }
              />
            )}
          </>
        )}
      </div>

      {showModal && (
        <RoundFormModal
          round={null}
          onClose={() => setShowModal(false)}
          onSaved={(name) => {
            setShowModal(false)
            setNotice(`"${name}" created.`)
            reload()
          }}
        />
      )}

      {editing && (
        <RoundFormModal
          round={editing}
          onClose={() => setEditing(null)}
          onSaved={(name) => {
            setEditing(null)
            setNotice(`"${name}" updated.`)
            reload()
          }}
        />
      )}

      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setConfirmClose(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1E293B] mb-2">Close “{confirmClose.name}”?</h2>
            <p className="text-sm text-[#64748B] mb-4">
              Every unhired applicant in this round moves into the applicant pool and receives a pool
              invitation email. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClose(null)}
                className="flex-1 border border-[#E2E8F0] text-[#64748B] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClose(confirmClose)}
                disabled={busyId === confirmClose.id}
                className="flex-1 bg-[#DC2626] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {busyId === confirmClose.id ? 'Closing…' : 'Close Round'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Create when `round` is null, otherwise edit that round's details. */
function RoundFormModal({
  round,
  onClose,
  onSaved,
}: {
  round: HiringRound | null
  onClose: () => void
  onSaved: (name: string) => void
}) {
  const currentYear = new Date().getFullYear()
  const isEdit = round !== null

  const [name, setName] = useState(round?.name ?? '')
  const [semester, setSemester] = useState(round?.semester ?? '1st Semester')
  const [year, setYear] = useState(String(round?.academic_year ?? currentYear))
  const [start, setStart] = useState(round?.start_date ?? '')
  const [end, setEnd] = useState(round?.end_date ?? '')
  const [makeActive, setMakeActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Applications attach to the active round with the latest start date, so moving
  // it on a round that already has applications can redirect incoming ones.
  const startDateWarning =
    isEdit && round.applications_count > 0 && start !== round.start_date

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const details = {
      name: name.trim(),
      semester,
      academic_year: Number(year),
      start_date: start,
      end_date: end,
    }

    try {
      if (isEdit) {
        await updateHiringRound(round.id, details)
      } else {
        await createHiringRound({ ...details, status: makeActive ? 'active' : 'closed' })
      }
      onSaved(name.trim())
    } catch (err) {
      if (err instanceof ApiError) {
        setError(Object.values(err.errors)[0]?.[0] ?? err.message)
      } else {
        setError(isEdit ? 'Could not save the round.' : 'Could not create the round.')
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-bold text-[#1E293B]">
            {isEdit ? 'Edit Hiring Round' : 'Create Hiring Round'}
          </h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] p-1" aria-label="Close">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

            <div>
              <label htmlFor="r-name" className="block text-sm font-semibold text-[#1E293B] mb-1">
                Round Name <span className="text-red-500">*</span>
              </label>
              <input
                id="r-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g., AY ${currentYear} First Semester`}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="r-semester" className="block text-sm font-semibold text-[#1E293B] mb-1">
                  Semester <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="r-semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                  <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="r-year" className="block text-sm font-semibold text-[#1E293B] mb-1">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <input
                  id="r-year"
                  required
                  type="number"
                  min={2000}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                />
                <p className="text-xs text-[#94A3B8] mt-1">Single starting year, e.g. {currentYear}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="r-start" className="block text-sm font-semibold text-[#1E293B] mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="r-start"
                  required
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                />
              </div>

              <div>
                <label htmlFor="r-end" className="block text-sm font-semibold text-[#1E293B] mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="r-end"
                  required
                  type="date"
                  min={start || undefined}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                />
              </div>
            </div>

            {startDateWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-[#92400E]">
                <FiAlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  This round already has {round.applications_count} application
                  {round.applications_count === 1 ? '' : 's'}. New applications attach to the active
                  round with the latest start date, so changing it may send them elsewhere.
                </span>
              </div>
            )}

            {!isEdit && (
              <label className="flex items-start gap-2 text-sm text-[#1E293B]">
                <input
                  type="checkbox"
                  checked={makeActive}
                  onChange={(e) => setMakeActive(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 accent-[#2563EB]"
                />
                <span>
                  Make this round active
                  <span className="block text-xs text-[#64748B]">
                    New applications attach to the active round with the latest start date.
                  </span>
                </span>
              </label>
            )}

            {isEdit && (
              <p className="text-xs text-[#64748B]">
                Use Close Round to move this round through its lifecycle — closing also moves
                unhired applicants into the pool.
              </p>
            )}
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#E2E8F0] text-[#64748B] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {isEdit
                ? submitting
                  ? 'Saving…'
                  : 'Save Changes'
                : submitting
                  ? 'Creating…'
                  : 'Create Round'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
