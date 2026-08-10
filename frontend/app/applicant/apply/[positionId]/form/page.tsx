'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FiArrowLeft,
  FiSave,
  FiCheckCircle,
  FiAlertTriangle,
  FiBriefcase,
} from 'react-icons/fi'
import { EmptyState, ErrorBanner, ErrorState, Spinner, SuccessBanner } from '@/components/shared/DataState'
import { ApiError } from '@/lib/api/client'
import {
  getApplicationResponses,
  getOpenPosition,
  getPositionForm,
  saveApplicationResponses,
  startApplication,
  submitApplication,
} from '@/lib/api/applicant'
import { useResource } from '@/lib/useResource'
import type { PositionFormField } from '@/lib/types'

export default function ApplicationFormPage() {
  const params = useParams<{ positionId: string }>()
  const positionId = params.positionId

  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [startError, setStartError] = useState<string | null>(null)

  const { data: position } = useResource(() => getOpenPosition(positionId), [positionId])
  const { data: criteria, loading: criteriaLoading, error: criteriaError, reload } = useResource(
    () => getPositionForm(positionId),
    [positionId],
  )

  // The draft is normally created on the upload step, but the form is also
  // reachable directly from a draft in My Applications. store() is idempotent.
  useEffect(() => {
    let active = true
    startApplication(positionId)
      .then((app) => {
        if (active) setApplicationId(app.id)
      })
      .catch((err) => {
        if (!active) return
        setStartError(
          err instanceof ApiError
            ? (Object.values(err.errors)[0]?.[0] ?? err.message)
            : 'Could not start this application.',
        )
      })
    return () => {
      active = false
    }
  }, [positionId])

  // Rehydrate any answers already saved on the draft.
  useEffect(() => {
    if (!applicationId) return
    let active = true
    getApplicationResponses(applicationId)
      .then((rows) => {
        if (!active) return
        const restored: Record<string, string> = {}
        for (const row of rows ?? []) {
          if (row.raw_value !== null) restored[row.criterion_id] = String(row.raw_value)
        }
        setAnswers((current) => ({ ...restored, ...current }))
      })
      .catch(() => {
        // A brand-new draft has no responses yet — nothing to restore.
      })
    return () => {
      active = false
    }
  }, [applicationId])

  function buildPayload(list: PositionFormField[]) {
    return list
      .filter((c) => (answers[c.id] ?? '') !== '')
      .map((c) => ({ criterion_id: c.id, raw_value: answers[c.id] }))
  }

  async function handleSaveDraft() {
    if (!applicationId || !criteria) return
    setSaving(true)
    setError(null)
    try {
      await saveApplicationResponses(applicationId, buildPayload(criteria))
      setNotice('Draft saved. You can come back and finish this later.')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (Object.values(err.errors)[0]?.[0] ?? err.message)
          : 'Could not save your draft.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!applicationId || !criteria) return

    setSubmitting(true)
    setError(null)

    try {
      // Answers must be persisted before submit — the API has no combined endpoint.
      await saveApplicationResponses(applicationId, buildPayload(criteria))
      await submitApplication(applicationId)
      setSubmitted(true)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (Object.values(err.errors)[0]?.[0] ?? err.message)
          : 'Could not submit your application.',
      )
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 sm:p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <FiCheckCircle className="w-10 h-10 text-[#16A34A]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] mb-2 tracking-tight">
            Application Submitted!
          </h1>
          <p className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">
            Your application for <strong>{position?.title ?? 'this position'}</strong> has been
            received. A confirmation email is on its way, and you&apos;ll be notified whenever the
            status changes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/applicant/my-applications"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors"
            >
              View My Applications
            </Link>
            <Link
              href="/applicant/positions"
              className="inline-flex items-center justify-center px-5 py-2.5 border border-[#E2E8F0] text-[#1E293B] rounded-lg text-sm font-semibold hover:bg-[#F8FAFF] transition-colors"
            >
              Browse More Positions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        href={`/applicant/apply/${positionId}/upload`}
        className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] mb-4"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Resume Details
      </Link>

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
          <span className="font-semibold text-[#2563EB]">Step 2 of 2</span>
          <span>—</span>
          <span>Application Form</span>
        </div>
        <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div className="h-full w-full bg-[#2563EB] rounded-full" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
            <FiBriefcase className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1E293B] tracking-tight">
              {position?.title ?? 'Application Form'}
              {position?.department ? ` — ${position.department.code}` : ''}
            </h1>
            <p className="text-xs text-[#64748B]">
              {position?.department?.name ?? 'Complete every required field below.'}
            </p>
          </div>
        </div>
      </div>

      {notice && <SuccessBanner message={notice} onDismiss={() => setNotice(null)} />}
      {startError && <ErrorBanner message={startError} />}
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {criteriaError ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <ErrorState message={criteriaError} onRetry={reload} />
        </div>
      ) : criteriaLoading ? (
        <Spinner label="Loading the application form…" />
      ) : !criteria || criteria.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <EmptyState
            title="This position has no evaluation criteria yet"
            description="HR is still configuring this position's form. Please check back shortly."
            action={
              <Link
                href="/applicant/positions"
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-semibold text-[#1E293B] hover:bg-[#F8FAFF]"
              >
                Back to Positions
              </Link>
            }
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
            <h2 className="text-base font-bold text-[#1E293B] mb-1">Evaluation Criteria</h2>
            <p className="text-xs text-[#64748B] mb-5">
              Provide accurate information — these answers are what compute your WSM score.
            </p>

            <div className="space-y-5">
              {criteria.map((c) => (
                <Field key={c.id} label={c.name} hint={c.description} required={c.is_required}>
                  <CriterionInput
                    criterion={c}
                    value={answers[c.id] ?? ''}
                    onChange={(value) => setAnswers((prev) => ({ ...prev, [c.id]: value }))}
                  />
                </Field>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
            <FiAlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-900">
              Once submitted, your responses cannot be edited. Please review carefully before clicking
              Submit.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pb-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || !applicationId}
              className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[#E2E8F0] text-[#1E293B] rounded-lg text-sm font-semibold hover:bg-[#F8FAFF] transition-colors disabled:opacity-60"
            >
              <FiSave className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              type="submit"
              disabled={submitting || !applicationId}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-60"
            >
              <FiCheckCircle className="w-4 h-4" />
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #1e293b;
          outline: none;
        }
        :global(.form-input:focus) {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
        }
      `}</style>
    </div>
  )
}

function CriterionInput({
  criterion,
  value,
  onChange,
}: {
  criterion: PositionFormField
  value: string
  onChange: (value: string) => void
}) {
  const min = criterion.min_value === null ? undefined : Number(criterion.min_value)
  const max = criterion.max_value === null ? undefined : Number(criterion.max_value)

  switch (criterion.data_type) {
    case 'numeric':
      return (
        <input
          type="number"
          required={criterion.is_required}
          min={min}
          max={max}
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={min !== undefined && max !== undefined ? `${min} – ${max}` : '0'}
          className="form-input"
        />
      )

    case 'boolean':
      return (
        <div className="flex items-center gap-4">
          {['true', 'false'].map((option) => (
            <label key={option} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`bool-${criterion.id}`}
                required={criterion.is_required}
                checked={value === option}
                onChange={() => onChange(option)}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span className="text-sm text-[#1E293B]">{option === 'true' ? 'Yes' : 'No'}</span>
            </label>
          ))}
        </div>
      )

    case 'select':
      return (
        <select
          required={criterion.is_required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="form-input"
        >
          <option value="">Select an option…</option>
          {(criterion.options ?? []).map((o) => (
            <option key={o.id} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )

    default:
      return (
        <textarea
          rows={3}
          required={criterion.is_required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter details…"
          className="form-input resize-y"
        />
      )
  }
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string | null
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#1E293B] mb-1">
        {label}
        {required && <span className="text-[#DC2626] ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-[#64748B] mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}
