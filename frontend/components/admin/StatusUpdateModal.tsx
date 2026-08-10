'use client'

import { useState } from 'react'
import { FiX } from 'react-icons/fi'
import { ApiError } from '@/lib/api/client'
import { updateApplicationStatus } from '@/lib/api/admin'
import { statusLabel } from '@/lib/format'
import { ErrorBanner } from '@/components/shared/DataState'
import type { ApplicationStatus } from '@/lib/types'

/**
 * Mirrors ApplicationStatusController::VALID_TRANSITIONS exactly, so the dropdown
 * can never offer a move the API will reject. The pipeline is strictly linear —
 * applied → for_interview → for_review → hired — with rejection/withdrawal
 * available at every step. draft and the three final states allow nothing.
 */
const ALLOWED_NEXT: Record<string, ApplicationStatus[]> = {
  applied: ['for_interview', 'rejected', 'withdrawn'],
  for_interview: ['for_review', 'rejected', 'withdrawn'],
  for_review: ['hired', 'rejected', 'withdrawn'],
  hired: [],
  rejected: [],
  withdrawn: [],
  draft: [],
}

export default function StatusUpdateModal({
  applicationId,
  applicantName,
  currentStatus,
  onClose,
  onUpdated,
}: {
  applicationId: string
  applicantName: string
  currentStatus: ApplicationStatus
  onClose: () => void
  onUpdated: (newStatus: string) => void
}) {
  const options = ALLOWED_NEXT[currentStatus] ?? []
  const [status, setStatus] = useState<string>(options[0] ?? '')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const terminal = options.length === 0

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!status) return

    setSubmitting(true)
    setError(null)

    try {
      await updateApplicationStatus(applicationId, status, notes.trim() || undefined)
      onUpdated(status)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.fieldError('status') ?? err.message)
          : 'Could not update the status.',
      )
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-base font-semibold text-[#1E293B]">Update Status</h2>
            <p className="text-xs text-[#64748B] mt-0.5">{applicantName}</p>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B]" aria-label="Close">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

          <div className="mb-4 text-sm">
            <span className="text-[#64748B]">Current status: </span>
            <span className="font-semibold text-[#1E293B]">{statusLabel(currentStatus)}</span>
          </div>

          {terminal ? (
            <p className="text-sm text-[#64748B] mb-5">
              {currentStatus === 'draft'
                ? 'This application has not been submitted yet, so it cannot be progressed.'
                : `${statusLabel(currentStatus)} is a final status — it cannot be changed.`}
            </p>
          ) : (
            <>
              <div className="mb-4">
                <label
                  htmlFor="status"
                  className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5"
                >
                  New Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {statusLabel(option)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="notes"
                  className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5"
                >
                  Notes <span className="text-[#94A3B8] normal-case font-normal">(internal, optional)</span>
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for the change…"
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <p className="text-xs text-[#94A3B8] mt-1.5">
                  Notes stay internal — applicants never see them.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFF]"
            >
              Cancel
            </button>
            {!terminal && (
              <button
                type="submit"
                disabled={submitting || !status}
                className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Update Status'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
