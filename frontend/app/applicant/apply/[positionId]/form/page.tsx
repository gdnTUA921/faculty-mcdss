'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  FiArrowLeft,
  FiSave,
  FiCheckCircle,
  FiAlertTriangle,
  FiBriefcase,
} from 'react-icons/fi'
import { positionCriteria, currentUser } from '@/lib/applicantData'

export default function ApplicationFormPage() {
  const [submitted, setSubmitted] = useState(false)

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
            Your application for <strong>Assistant Professor I</strong> has been received. You will be notified by email when there is an update.
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

  const isInternal = currentUser.type === 'internal'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        href="/applicant/apply/pos-001/upload"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] mb-4"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Resume Upload
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
              Assistant Professor I — DIT
            </h1>
            <p className="text-xs text-[#64748B]">Application form for AY 2025-2026 First Semester</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitted(true)
        }}
        className="space-y-6"
      >
        {/* Internal Staff Section */}
        {isInternal && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-[#1E293B]">Internal Staff Information</h2>
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                Internal Form
              </span>
            </div>
            <p className="text-xs text-[#64748B] mb-5">Required for internal applicants only</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Current Role" required>
                <input type="text" defaultValue="Instructor III" className="form-input" />
              </Field>
              <Field label="Years of Service" required>
                <input type="number" defaultValue={8} className="form-input" />
              </Field>
              <Field label="Preferred Teaching Load (units)">
                <input type="number" defaultValue={12} className="form-input" />
              </Field>
              <Field label="Availability">
                <select className="form-input">
                  <option>Full-time</option>
                  <option>Part-time</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* Evaluation Criteria Fields */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="text-base font-bold text-[#1E293B] mb-1">Evaluation Criteria</h2>
          <p className="text-xs text-[#64748B] mb-5">Provide accurate information — these fields are used to compute your WSM score</p>

          <div className="space-y-5">
            {positionCriteria.map((c) => (
              <Field
                key={c.id}
                label={c.name}
                hint={c.description}
                required={c.required}
              >
                {c.dataType === 'numeric' && (
                  <input
                    type="number"
                    min={c.minValue}
                    max={c.maxValue}
                    placeholder={c.minValue !== undefined ? `${c.minValue} – ${c.maxValue}` : '0'}
                    className="form-input"
                  />
                )}
                {c.dataType === 'text' && (
                  <textarea
                    rows={3}
                    placeholder="Enter details..."
                    className="form-input resize-y"
                  />
                )}
                {c.dataType === 'boolean' && (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name={`bool-${c.id}`} className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]" />
                      <span className="text-sm text-[#1E293B]">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name={`bool-${c.id}`} className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]" />
                      <span className="text-sm text-[#1E293B]">No</span>
                    </label>
                  </div>
                )}
                {c.dataType === 'select' && c.options && (
                  <select className="form-input">
                    <option value="">Select an option…</option>
                    {c.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                )}
              </Field>
            ))}
          </div>
        </div>

        {/* Notice */}
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
          <FiAlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-900">
            Once submitted, your responses cannot be edited. Please review carefully before clicking Submit.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pb-2">
          <button
            type="button"
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[#E2E8F0] text-[#1E293B] rounded-lg text-sm font-semibold hover:bg-[#F8FAFF] transition-colors"
          >
            <FiSave className="w-4 h-4" />
            Save Draft
          </button>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors"
          >
            <FiCheckCircle className="w-4 h-4" />
            Submit Application
          </button>
        </div>
      </form>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #1E293B;
          outline: none;
        }
        :global(.form-input:focus) {
          border-color: #2563EB;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
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
