'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
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
import { EmptyState, ErrorBanner, ErrorState, Spinner } from '@/components/shared/DataState'
import { downloadMyDocument, getMyApplication, getMyDocuments } from '@/lib/api/applicant'
import { formatDate, formatDateTime, formatFileSize, humanize } from '@/lib/format'
import { useResource } from '@/lib/useResource'

export default function ApplicationDetailPage() {
  const params = useParams<{ applicationId: string }>()
  const applicationId = params.applicationId

  const [downloadError, setDownloadError] = useState<string | null>(null)

  const { data: app, loading, error, reload } = useResource(
    () => getMyApplication(applicationId),
    [applicationId],
  )

  const { data: documents } = useResource(() => getMyDocuments(), [])

  if (loading) return <Spinner label="Loading application…" />

  if (error || !app) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <BackLink />
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <ErrorState message={error ?? 'Application not found.'} onRetry={reload} />
        </div>
      </div>
    )
  }

  // Documents tied to this application, plus profile-level uploads (resume, TOR)
  // that are not attached to any single application.
  const relevantDocs = (documents ?? []).filter(
    (d) => !d.application_id || d.application_id === applicationId,
  )

  async function handleDownload(id: string, fileName: string) {
    setDownloadError(null)
    try {
      await downloadMyDocument(id, fileName)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <BackLink />

      {downloadError && <ErrorBanner message={downloadError} onDismiss={() => setDownloadError(null)} />}

      {/* Header card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-7 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 rounded-lg bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
              <FiBriefcase className="w-6 h-6 text-[#2563EB]" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight mb-1">
                {app.position.title}
              </h1>
              <p className="text-xs text-[#64748B]">{app.hiring_round.name}</p>
            </div>
          </div>
          <StatusBadge status={app.status} size="md" />
        </div>
      </div>

      {/* Pipeline tracker */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-7 mb-6">
        <h2 className="text-base font-bold text-[#1E293B] mb-1">Hiring Pipeline</h2>
        <p className="text-xs text-[#64748B] mb-6">
          {app.pipeline_position
            ? `Stage ${app.pipeline_position} of ${app.total_steps}`
            : 'Track your progress through each stage'}
        </p>
        <HiringPipeline currentStatus={app.status} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7 pt-5 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#F8FAFF] rounded-lg">
            <FiCalendar className="w-4 h-4 text-[#64748B]" />
            <div className="text-sm">
              <p className="text-xs text-[#64748B]">Applied On</p>
              <p className="font-semibold text-[#1E293B]">{formatDate(app.applied_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-[#F8FAFF] rounded-lg">
            <FiCalendar className="w-4 h-4 text-[#64748B]" />
            <div className="text-sm">
              <p className="text-xs text-[#64748B]">Last Updated</p>
              <p className="font-semibold text-[#1E293B]">
                {formatDate(app.status_updated_at ?? app.applied_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status history */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
        <div className="px-5 sm:px-7 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#1E293B]">Status History</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Every change to your application</p>
        </div>
        {app.status_history.length === 0 ? (
          <EmptyState
            title="No status changes yet"
            description="Your application is waiting to be reviewed."
          />
        ) : (
          <ul className="divide-y divide-[#E2E8F0]">
            {app.status_history.map((entry) => (
              <li key={entry.id} className="px-5 sm:px-7 py-4 flex flex-wrap items-center gap-2">
                {entry.previous_status && (
                  <>
                    <StatusBadge status={entry.previous_status} />
                    <span className="text-[#64748B] text-sm">→</span>
                  </>
                )}
                <StatusBadge status={entry.new_status} />
                <span className="text-xs text-[#64748B] ml-auto">
                  {formatDateTime(entry.changed_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-5 sm:px-7 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">Documents Submitted</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {relevantDocs.length} document{relevantDocs.length === 1 ? '' : 's'} on file
            </p>
          </div>
          <Link
            href="/applicant/documents"
            className="text-xs font-semibold text-[#2563EB] hover:underline"
          >
            Manage documents
          </Link>
        </div>

        {relevantDocs.length === 0 ? (
          <EmptyState
            title="No documents uploaded"
            description="Upload your resume and supporting documents from the Documents page."
          />
        ) : (
          <ul className="divide-y divide-[#E2E8F0]">
            {relevantDocs.map((doc) => (
              <li
                key={doc.id}
                className="px-5 sm:px-7 py-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-[#F8FAFF] border border-[#E2E8F0] flex items-center justify-center flex-shrink-0">
                    <FiFileText className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1E293B] truncate">
                      {humanize(doc.document_type)}
                    </p>
                    <p className="text-xs text-[#64748B] truncate">
                      {doc.file_name} · {formatFileSize(doc.file_size_bytes)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <StatusBadge status={doc.is_verified ? 'verified' : 'unverified'} />
                  <button
                    onClick={() => handleDownload(doc.id, doc.file_name)}
                    className="text-[#2563EB] hover:text-[#1E3A8A] p-1.5 rounded-md hover:bg-[#DBEAFE]"
                    title={`Download ${doc.file_name}`}
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {app.status === 'for_interview' && (
        <div className="mt-6 px-5 py-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <FiCheckCircle className="w-5 h-5 text-[#2563EB] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#1E3A8A]">You&apos;ve been shortlisted!</p>
            <p className="text-xs text-[#1E3A8A] mt-0.5">
              HR will reach out shortly to schedule your interview. Please monitor your email and
              notifications.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/applicant/my-applications"
      className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] mb-4"
    >
      <FiArrowLeft className="w-4 h-4" />
      Back to My Applications
    </Link>
  )
}
