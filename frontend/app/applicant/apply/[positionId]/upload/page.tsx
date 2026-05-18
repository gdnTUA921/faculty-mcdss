'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiUploadCloud,
  FiFile,
  FiCheckCircle,
  FiInfo,
  FiZap,
} from 'react-icons/fi'

type Step = 'upload' | 'parsing' | 'confirm'

export default function ResumeUploadPage() {
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('')

  const handleParse = () => {
    setFileName('delacruz_cv.pdf')
    setStep('parsing')
    setTimeout(() => setStep('confirm'), 1500)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        href="/applicant/positions"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] mb-4"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Positions
      </Link>

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
          <span className="font-semibold text-[#2563EB]">Step 1 of 2</span>
          <span>—</span>
          <span>Resume Upload</span>
        </div>
        <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-[#2563EB] rounded-full" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] mb-1 tracking-tight">
          Upload Your Resume
        </h1>
        <p className="text-sm text-[#64748B] mb-6">
          We&apos;ll parse your CV and auto-fill the application form. You&apos;ll review everything before submission.
        </p>

        {step === 'upload' && (
          <>
            <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-8 sm:p-12 text-center bg-[#F8FAFF] hover:border-[#2563EB] hover:bg-blue-50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-[#DBEAFE] flex items-center justify-center mx-auto mb-4">
                <FiUploadCloud className="w-8 h-8 text-[#2563EB]" />
              </div>
              <p className="text-base font-semibold text-[#1E293B] mb-1">
                Drag & drop your resume here
              </p>
              <p className="text-sm text-[#64748B] mb-5">or click to browse files</p>
              <button
                onClick={handleParse}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors"
              >
                <FiFile className="w-4 h-4" />
                Choose File
              </button>
              <p className="text-xs text-[#64748B] mt-4">
                Supported formats: <span className="font-semibold">PDF, DOC, DOCX</span> · Max 10MB
              </p>
            </div>

            <div className="mt-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
              <FiInfo className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#1E3A8A]">
                <span className="font-semibold">Tip:</span> A well-formatted CV will produce more accurate auto-fill results. Make sure your education, experience, and certifications are clearly labeled.
              </p>
            </div>
          </>
        )}

        {step === 'parsing' && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#DBEAFE] flex items-center justify-center mx-auto mb-5 animate-pulse">
              <FiZap className="w-8 h-8 text-[#2563EB]" />
            </div>
            <p className="text-lg font-bold text-[#1E293B] mb-1">Parsing your resume…</p>
            <p className="text-sm text-[#64748B]">Extracting your education, experience, and credentials.</p>
            <div className="max-w-xs mx-auto mt-6 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-[#2563EB] rounded-full animate-pulse" />
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div>
            <div className="border border-[#16A34A] bg-green-50 rounded-xl p-5 mb-6 flex items-start gap-3">
              <FiCheckCircle className="w-5 h-5 text-[#16A34A] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-[#15803D] text-sm mb-0.5">Resume parsed successfully</p>
                <p className="text-xs text-green-700">{fileName} · Extracted 8 fields</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-[#1E293B] mb-3">Extracted Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-6">
              <ExtractedField label="Highest Degree" value="Master of Science in IT" />
              <ExtractedField label="Years of Teaching" value="6 years" />
              <ExtractedField label="Publications" value="5 papers" />
              <ExtractedField label="Certifications" value="PRC License, ITIL Foundation" />
              <ExtractedField label="Specialization" value="Software Engineering" />
              <ExtractedField label="Current Position" value="Senior Software Engineer" />
            </div>

            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 mb-6">
              <FiInfo className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-900">
                Please review the extracted information on the next page and fill in any missing or incorrect details before submitting.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2.5 border border-[#E2E8F0] text-[#1E293B] rounded-lg text-sm font-semibold hover:bg-[#F8FAFF] transition-colors"
              >
                Re-upload
              </button>
              <Link
                href="/applicant/apply/pos-001/form"
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors"
              >
                Continue to Application Form
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ExtractedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg p-3">
      <p className="text-xs text-[#64748B] uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[#1E293B]">{value}</p>
    </div>
  )
}
