import Link from 'next/link'
import {
  FiArrowLeft,
  FiCalendar,
  FiFileText,
  FiBriefcase,
  FiCheckCircle,
  FiDownload,
} from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import HiringPipeline from '@/components/applicant/HiringPipeline'
import { myApplications, formResponses, myDocuments } from '@/lib/applicantData'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ApplicationDetailPage() {
  const app = myApplications[0]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        href="/applicant/my-applications"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] mb-4"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to My Applications
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-7 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 rounded-lg bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
              <FiBriefcase className="w-6 h-6 text-[#2563EB]" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight mb-1">
                {app.positionTitle}
              </h1>
              <p className="text-sm text-[#64748B] mb-1">{app.department}</p>
              <p className="text-xs text-[#64748B]">{app.hiringRound}</p>
            </div>
          </div>
          <StatusBadge status={app.status} size="md" />
        </div>
      </div>

      {/* Pipeline tracker */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-7 mb-6">
        <h2 className="text-base font-bold text-[#1E293B] mb-1">Hiring Pipeline</h2>
        <p className="text-xs text-[#64748B] mb-6">Track your progress through each stage</p>
        <HiringPipeline currentStatus={app.status} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7 pt-5 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#F8FAFF] rounded-lg">
            <FiCalendar className="w-4 h-4 text-[#64748B]" />
            <div className="text-sm">
              <p className="text-xs text-[#64748B]">Applied On</p>
              <p className="font-semibold text-[#1E293B]">{formatDate(app.appliedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-[#F8FAFF] rounded-lg">
            <FiCalendar className="w-4 h-4 text-[#64748B]" />
            <div className="text-sm">
              <p className="text-xs text-[#64748B]">Last Updated</p>
              <p className="font-semibold text-[#1E293B]">{formatDate(app.lastUpdated)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Responses */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
        <div className="px-5 sm:px-7 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#1E293B]">My Submitted Responses</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Read-only — your responses cannot be edited after submission</p>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {formResponses.map((r) => (
            <div key={r.criterion} className="px-5 sm:px-7 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="sm:max-w-[40%]">
                <p className="text-sm font-semibold text-[#1E293B]">{r.criterion}</p>
                <p className="text-xs text-[#64748B] mt-0.5 capitalize">{r.dataType}</p>
              </div>
              <p className="text-sm text-[#1E293B] sm:text-right sm:max-w-[55%]">{r.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Documents Submitted */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-5 sm:px-7 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">Documents Submitted</h2>
            <p className="text-xs text-[#64748B] mt-0.5">{myDocuments.length} documents on file</p>
          </div>
        </div>

        <ul className="divide-y divide-[#E2E8F0]">
          {myDocuments.map((doc) => (
            <li key={doc.id} className="px-5 sm:px-7 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-lg bg-[#F8FAFF] border border-[#E2E8F0] flex items-center justify-center flex-shrink-0">
                  <FiFileText className="w-4 h-4 text-[#2563EB]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1E293B] truncate">{doc.documentType}</p>
                  <p className="text-xs text-[#64748B] truncate">{doc.fileName} · {doc.fileSize}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <StatusBadge status={doc.verified} />
                <button className="text-[#2563EB] hover:text-[#1E3A8A] p-1.5 rounded-md hover:bg-[#DBEAFE]">
                  <FiDownload className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {app.status === 'for_interview' && (
        <div className="mt-6 px-5 py-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <FiCheckCircle className="w-5 h-5 text-[#2563EB] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#1E3A8A]">You&apos;ve been shortlisted!</p>
            <p className="text-xs text-[#1E3A8A] mt-0.5">HR will reach out shortly to schedule your interview. Please monitor your email and notifications.</p>
          </div>
        </div>
      )}
    </div>
  )
}
