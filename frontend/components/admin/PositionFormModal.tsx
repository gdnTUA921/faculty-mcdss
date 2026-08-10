'use client'

import { useState } from 'react'
import { FiChevronDown, FiLock, FiX } from 'react-icons/fi'
import { ErrorBanner } from '@/components/shared/DataState'
import { ApiError } from '@/lib/api/client'
import { createPosition, updatePosition } from '@/lib/api/admin'
import type { DepartmentRef, Position } from '@/lib/types'

/**
 * Create when `position` is null, otherwise edit that position's details.
 *
 * Status is absent by design — opening a position requires its criteria weights
 * to total 100%, so that move stays on the Close/Re-open control which checks it.
 */
export default function PositionFormModal({
  position,
  departments,
  onClose,
  onSaved,
}: {
  position: Position | null
  departments: (DepartmentRef & { description?: string | null })[]
  onClose: () => void
  onSaved: (title: string) => void
}) {
  const isEdit = position !== null

  const [title, setTitle] = useState(position?.title ?? '')
  const [description, setDescription] = useState(position?.description ?? '')
  const [departmentId, setDepartmentId] = useState(position?.department_id ?? '')
  const [targetType, setTargetType] = useState<string>(position?.target_applicant_type ?? 'both')
  const [slots, setSlots] = useState(String(position?.slots_available ?? 1))
  // The API serializes application_deadline as a full ISO datetime (e.g.
  // 2027-03-31T00:00:00.000000Z), but <input type="date"> only accepts YYYY-MM-DD
  // and silently blanks anything else — so slice off the time portion.
  const [deadline, setDeadline] = useState(position?.application_deadline?.slice(0, 10) ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Department and target type decide who was eligible to apply and which director
  // sees the results, so they freeze once real applications exist. The backend
  // enforces this too — this just stops the form offering an edit that will fail.
  const applicationCount = position?.applications_count ?? 0
  const eligibilityLocked = isEdit && applicationCount > 0

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const details = {
      title: title.trim(),
      description: description.trim() || null,
      slots_available: Number(slots),
      application_deadline: deadline || null,
    }

    try {
      if (isEdit) {
        await updatePosition(position.id, {
          ...details,
          // Omitted entirely when locked so an unchanged resend can't trip the guard.
          ...(eligibilityLocked
            ? {}
            : { department_id: departmentId, target_applicant_type: targetType }),
        })
      } else {
        await createPosition({
          ...details,
          department_id: departmentId,
          target_applicant_type: targetType,
        })
      }
      onSaved(title.trim())
    } catch (err) {
      if (err instanceof ApiError) {
        setError(Object.values(err.errors)[0]?.[0] ?? err.message)
      } else {
        setError(isEdit ? 'Could not save the position.' : 'Could not create the position.')
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-bold text-[#1E293B]">
            {isEdit ? 'Edit Position' : 'Create New Position'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#1E293B] p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-[#1E293B] mb-1">
                Position Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Assistant Professor I"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-[#1E293B] mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the position requirements and responsibilities…"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-semibold text-[#1E293B] mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="department"
                    required
                    disabled={eligibilityLocked}
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white disabled:bg-gray-50 disabled:text-[#94A3B8] disabled:cursor-not-allowed"
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="targetType" className="block text-sm font-semibold text-[#1E293B] mb-1">
                  Target Applicant Type
                </label>
                <div className="relative">
                  <select
                    id="targetType"
                    disabled={eligibilityLocked}
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white disabled:bg-gray-50 disabled:text-[#94A3B8] disabled:cursor-not-allowed"
                  >
                    <option value="both">Both</option>
                    <option value="external">External</option>
                    <option value="internal">Internal</option>
                  </select>
                  <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                </div>
              </div>
            </div>

            {eligibilityLocked && (
              <div className="flex items-start gap-2 rounded-lg border border-[#E2E8F0] bg-gray-50 px-3 py-2 text-xs text-[#64748B]">
                <FiLock className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Department and target applicant type are locked — {applicationCount} applicant
                  {applicationCount === 1 ? ' has' : 's have'} already applied under these terms.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="slots" className="block text-sm font-semibold text-[#1E293B] mb-1">
                  Slots Available <span className="text-red-500">*</span>
                </label>
                <input
                  id="slots"
                  required
                  type="number"
                  min={1}
                  value={slots}
                  onChange={(e) => setSlots(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                />
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-semibold text-[#1E293B] mb-1">
                  Application Deadline
                </label>
                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                />
              </div>
            </div>

            <p className="text-xs text-[#64748B] bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {isEdit ? (
                <>
                  Use the <strong>Close</strong> / <strong>Re-open</strong> control to change this
                  position&apos;s status — re-opening checks that criteria weights total 100%.
                </>
              ) : (
                <>
                  New positions are created <strong>open</strong> and are immediately visible to
                  eligible applicants. Add criteria totalling 100% weight right away, or close the
                  position until its criteria are configured.
                </>
              )}
            </p>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#E2E8F0] text-[#64748B] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {isEdit
                ? submitting
                  ? 'Saving…'
                  : 'Save Changes'
                : submitting
                  ? 'Creating…'
                  : 'Create Position'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
