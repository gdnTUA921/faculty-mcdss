'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiUser,
  FiFileText,
  FiDownload,
  FiBarChart2,
  FiLock,
} from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import {
  EmptyState,
  ErrorBanner,
  ErrorState,
  Spinner,
} from '@/components/shared/DataState'
import {
  downloadDocument,
  getApplication,
  getApplicationDocuments,
  getScoreBreakdown,
} from '@/lib/api/admin'
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  formatScore,
  humanize,
  initials,
} from '@/lib/format'
import { useResource } from '@/lib/useResource'

type Tab = 'profile' | 'score' | 'documents'

export default function ApplicantProfilePage() {
  const params = useParams<{ id: string }>()
  const applicationId = params.id

  const [tab, setTab] = useState<Tab>('profile')
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const { data: application, loading, error, reload } = useResource(
    () => getApplication(applicationId),
    [applicationId],
  )
  const { data: documents } = useResource(
    () => getApplicationDocuments(applicationId),
    [applicationId],
  )
  const { data: breakdown } = useResource(
    () => getScoreBreakdown(applicationId),
    [applicationId],
  )

  if (loading) return <Spinner label="Loading applicant…" />

  if (error || !application) {
    return (
      <div className="p-8">
        <BackLink positionId={null} />
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <ErrorState
            message={error ?? 'This applicant is not in your department.'}
            onRetry={reload}
          />
        </div>
      </div>
    )
  }

  const applicant = application.applicant
  const score = application.total_wsm_score === null ? null : Number(application.total_wsm_score)
  const docs = documents ?? []
  const rows = breakdown?.breakdown ?? []
  const totalWeighted = rows.reduce((sum, row) => sum + Number(row.weighted_score ?? 0), 0)

  async function handleDownload(documentId: string, fileName: string) {
    setDownloadError(null)
    try {
      await downloadDocument(documentId, fileName)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed.')
    }
  }

  return (
    <div className="p-8">
      <BackLink positionId={application.position?.id ?? null} />

      {/* Read-only banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-2.5">
        <FiLock className="w-4 h-4 text-amber-700 flex-shrink-0" />
        <p className="text-xs text-amber-900">
          <span className="font-semibold">Read-only view.</span> Directors can review applicants but
          cannot change status, scores or documents.
        </p>
      </div>

      {downloadError && <ErrorBanner message={downloadError} onDismiss={() => setDownloadError(null)} />}

      {/* Header card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-16 h-16 rounded-full bg-[#1E3A8A] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">
              {initials(applicant?.first_name, applicant?.last_name)}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#1E293B]">{applicant?.full_name ?? '—'}</h1>
              {applicant && <StatusBadge status={applicant.applicant_type} size="md" />}
              <StatusBadge status={application.status} size="md" />
            </div>
            <p className="text-[#64748B] text-sm">
              {application.position?.title ?? '—'}
              {application.position?.department ? ` · ${application.position.department.name}` : ''}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">{application.hiring_round?.name ?? ''}</p>
          </div>

          <div className="flex flex-col items-center justify-center bg-[#F8FAFF] rounded-xl px-6 py-4 border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              WSM Score
            </p>
            {score === null ? (
              <p className="text-sm text-[#94A3B8] py-2">Not scored</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-[#2563EB]">{formatScore(score)}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{(score * 100).toFixed(2)}%</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E2E8F0] mb-6">
        <div className="flex flex-wrap gap-0">
          {(
            [
              { id: 'profile', label: 'Profile' },
              { id: 'score', label: 'Score Breakdown' },
              { id: 'documents', label: `Documents (${docs.length})` },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                tab === t.id
                  ? 'px-4 py-3 text-sm font-semibold text-[#2563EB] border-b-2 border-[#2563EB] -mb-px'
                  : 'px-4 py-3 text-sm font-medium text-[#64748B] hover:text-[#1E293B] border-b-2 border-transparent -mb-px'
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile */}
      {tab === 'profile' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <FiUser className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-base font-semibold text-[#1E293B]">Applicant Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
            <Field label="Full Name" value={applicant?.full_name} icon={FiUser} />
            <Field label="Email Address" value={applicant?.email} icon={FiMail} />
            <Field label="Phone Number" value={applicant?.phone} icon={FiPhone} />
            <Field label="Institution Email" value={applicant?.institution_email} icon={FiMail} />
            <Field label="Applied On" value={formatDate(application.applied_at)} />
            <Field label="Last Status Update" value={formatDate(application.status_updated_at)} />
          </div>

          {application.summary && (
            <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">
                Summary
              </p>
              <p className="text-sm text-[#1E293B] leading-relaxed">{application.summary}</p>
            </div>
          )}

          {application.responses.length > 0 && (
            <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">
                Submitted Responses
              </p>
              <ul className="divide-y divide-[#E2E8F0]">
                {application.responses.map((r) => (
                  <li key={r.id} className="py-3 flex items-start justify-between gap-4">
                    <span className="text-sm font-medium text-[#1E293B]">
                      {r.criterion?.name ?? '—'}
                    </span>
                    <span className="text-sm text-[#64748B] text-right">{r.raw_value ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Score breakdown */}
      {tab === 'score' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
            <FiBarChart2 className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-base font-semibold text-[#1E293B]">Per-Criterion Breakdown</h2>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title="No score breakdown available"
              description="This application has not been scored yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Criterion</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Weight</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Raw Value</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide w-44">Normalized</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Weighted</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const normalized = Number(row.normalized_score ?? 0)
                    return (
                      <tr
                        key={`${row.criterion_name}-${idx}`}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}
                      >
                        <td className="px-6 py-3.5 font-semibold text-[#1E293B]">
                          {row.criterion_name}
                        </td>
                        <td className="px-4 py-3.5 text-[#64748B] font-semibold">
                          {Math.round(Number(row.weight) * 100)}%
                        </td>
                        <td className="px-4 py-3.5 text-[#1E293B]">{row.raw_value ?? '—'}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#1E293B] w-10">
                              {normalized.toFixed(2)}
                            </span>
                            <div className="flex-1 bg-[#E2E8F0] rounded-full h-1.5 min-w-[60px]">
                              <div
                                className="bg-[#2563EB] h-1.5 rounded-full"
                                style={{ width: `${Math.min(normalized * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-[#2563EB]">
                          {formatScore(row.weighted_score)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-[#DBEAFE] border-t-2 border-[#2563EB]">
                    <td className="px-6 py-3.5 font-bold text-[#1E293B]" colSpan={4}>
                      Total WSM Score
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#2563EB] text-base">
                      {formatScore(totalWeighted)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      {tab === 'documents' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
            <FiFileText className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-base font-semibold text-[#1E293B]">Submitted Documents</h2>
          </div>

          {docs.length === 0 ? (
            <EmptyState title="No documents uploaded" />
          ) : (
            <ul className="divide-y divide-[#E2E8F0]">
              {docs.map((doc) => (
                <li key={doc.id} className="px-6 py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-[#F8FAFF] border border-[#E2E8F0] flex items-center justify-center flex-shrink-0">
                      <FiFileText className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1E293B] truncate">
                        {humanize(doc.document_type)}
                      </p>
                      <p className="text-xs text-[#64748B] truncate">
                        {doc.file_name} · {formatFileSize(doc.file_size_bytes)} ·{' '}
                        {formatDateTime(doc.uploaded_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={doc.is_verified ? 'verified' : 'unverified'} />
                    <button
                      onClick={() => handleDownload(doc.id, doc.file_name)}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function BackLink({ positionId }: { positionId: string | null }) {
  return (
    <Link
      href={positionId ? `/director/positions/${positionId}` : '/director/positions'}
      className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] mb-4"
    >
      <FiArrowLeft className="w-4 h-4" />
      Back to Position
    </Link>
  )
}

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value?: string | null
  icon?: typeof FiUser
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{label}</p>
      <p className="text-sm text-[#1E293B] font-medium flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-[#94A3B8]" />}
        {value || '—'}
      </p>
    </div>
  )
}
