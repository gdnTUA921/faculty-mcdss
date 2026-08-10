'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { FiChevronLeft, FiCheck, FiDownload, FiEdit2, FiX } from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import StatusUpdateModal from '@/components/admin/StatusUpdateModal'
import {
  EmptyState,
  ErrorBanner,
  ErrorState,
  Spinner,
  SuccessBanner,
} from '@/components/shared/DataState'
import {
  downloadDocument,
  getApplication,
  getApplicationDocuments,
  getScoreBreakdown,
  setDocumentVerified,
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

type Tab = 'profile' | 'applications' | 'documents' | 'scores' | 'history'

function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const r = 48
  const circumference = 2 * Math.PI * r
  const strokeDash = (score * circumference).toFixed(2)
  const color = score >= 0.85 ? '#16A34A' : score >= 0.7 ? '#2563EB' : '#D97706'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-[#1E293B]">{score.toFixed(4)}</span>
        <span className="text-xs text-[#64748B] font-medium">{pct}%</span>
      </div>
    </div>
  )
}

export default function ApplicantProfilePage() {
  const params = useParams<{ id: string }>()
  const applicationId = params.id

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  const { data: application, loading, error, reload } = useResource(
    () => getApplication(applicationId),
    [applicationId],
  )

  // The review packet includes profile-level uploads, so it can differ from
  // application.documents. Fetched separately for its download URLs.
  const { data: documents, reload: reloadDocuments } = useResource(
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
        <BackLink />
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <ErrorState message={error ?? 'Applicant not found.'} onRetry={reload} />
        </div>
      </div>
    )
  }

  const applicant = application.applicant
  const score = application.total_wsm_score === null ? null : Number(application.total_wsm_score)
  const docs = documents ?? application.documents
  const rows = breakdown?.breakdown ?? []
  const totalWeighted = rows.reduce((sum, row) => sum + Number(row.weighted_score ?? 0), 0)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile Info' },
    { id: 'applications', label: 'Application' },
    { id: 'documents', label: 'Documents' },
    { id: 'scores', label: 'Score Breakdown' },
    { id: 'history', label: 'Status History' },
  ]

  async function handleDownload(documentId: string, fileName: string) {
    setDownloadError(null)
    try {
      await downloadDocument(documentId, fileName)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed.')
    }
  }

  async function handleVerify(documentId: string, nextVerified: boolean) {
    setDownloadError(null)
    setVerifyingId(documentId)
    try {
      const result = await setDocumentVerified(documentId, nextVerified)
      setNotice(result.message)
      reloadDocuments()
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : 'Could not update the verification status.',
      )
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <div className="p-8">
      <BackLink />

      {notice && <SuccessBanner message={notice} onDismiss={() => setNotice(null)} />}
      {downloadError && <ErrorBanner message={downloadError} onDismiss={() => setDownloadError(null)} />}

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-16 h-16 rounded-full bg-[#2563EB] flex items-center justify-center flex-shrink-0">
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
            <p className="text-[#64748B] text-sm mb-2">
              {applicant?.email ?? '—'}
              {applicant?.phone ? ` · ${applicant.phone}` : ''}
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="bg-[#DBEAFE] text-[#2563EB] px-3 py-1 rounded-full text-xs font-semibold">
                {application.position?.title ?? 'No position'}
              </span>
              <span className="bg-gray-100 text-[#64748B] px-3 py-1 rounded-full text-xs font-semibold">
                {application.position?.department?.name ?? '—'}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  applicant?.profile_completed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                Profile {applicant?.profile_completed ? 'Complete' : 'Incomplete'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-[#F8FAFF] rounded-xl px-6 py-4 border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">WSM Score</p>
            {score === null ? (
              <p className="text-sm text-[#94A3B8] py-2">Not scored yet</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-[#2563EB]">{formatScore(score)}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{(score * 100).toFixed(2)}%</p>
              </>
            )}
            <button
              onClick={() => setEditing(true)}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
              Update Status
            </button>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="border-b border-[#E2E8F0] mb-6">
        <div className="flex flex-wrap gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? 'px-4 py-3 text-sm font-semibold text-[#2563EB] border-b-2 border-[#2563EB] -mb-px transition-colors'
                  : 'px-4 py-3 text-sm font-medium text-[#64748B] hover:text-[#1E293B] border-b-2 border-transparent -mb-px transition-colors'
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Info */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-5">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
            <Field label="Full Name" value={applicant?.full_name} />
            <Field label="Email Address" value={applicant?.email} />
            <Field label="Phone Number" value={applicant?.phone} />
            <Field
              label="Applicant Type"
              node={applicant ? <StatusBadge status={applicant.applicant_type} /> : undefined}
            />
            <Field label="Institution Email" value={applicant?.institution_email} />
            <Field label="Account Created" value={formatDateTime(application.account_created_at)} />
            <Field label="Profile Completed" value={applicant?.profile_completed ? 'Yes' : 'No'} />
            <Field label="Hiring Round" value={application.hiring_round?.name} />
          </div>

          {application.summary && (
            <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Summary</p>
              <p className="text-sm text-[#1E293B] leading-relaxed">{application.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Application */}
      {activeTab === 'applications' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-semibold text-[#1E293B]">Application Detail</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Hiring Round</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">WSM Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-6 py-4 font-semibold text-[#1E293B]">
                      {application.position?.title ?? '—'}
                    </td>
                    <td className="px-4 py-4 text-[#64748B] text-xs">{application.hiring_round?.name ?? '—'}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="px-4 py-4 font-semibold text-[#2563EB]">{formatScore(score)}</td>
                    <td className="px-4 py-4 text-[#64748B] text-xs">{formatDate(application.applied_at)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Submitted form answers */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-semibold text-[#1E293B]">Submitted Responses</h2>
            </div>
            {application.responses.length === 0 ? (
              <EmptyState title="No responses recorded" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Criterion</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Answer</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {application.responses.map((response, idx) => (
                      <tr
                        key={response.id}
                        className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                      >
                        <td className="px-6 py-3.5 font-semibold text-[#1E293B]">
                          {response.criterion?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3.5 text-[#1E293B]">{response.raw_value ?? '—'}</td>
                        <td className="px-4 py-3.5 text-[#64748B] font-semibold">
                          {response.criterion ? `${Math.round(Number(response.criterion.weight) * 100)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documents */}
      {activeTab === 'documents' && (
        <div id="documents" className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-base font-semibold text-[#1E293B]">Submitted Documents</h2>
          </div>
          {docs.length === 0 ? (
            <EmptyState
              title="No documents uploaded"
              description="Documents the applicant uploads will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">File Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Size</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Verified</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Uploaded</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc, idx) => (
                    <tr
                      key={doc.id}
                      className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                    >
                      <td className="px-6 py-3.5 font-semibold text-[#1E293B]">{humanize(doc.document_type)}</td>
                      <td className="px-4 py-3.5 text-[#64748B] font-mono text-xs">{doc.file_name}</td>
                      <td className="px-4 py-3.5 text-[#64748B] text-xs">{formatFileSize(doc.file_size_bytes)}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={doc.is_verified ? 'verified' : 'unverified'} />
                        {doc.is_verified && doc.verified_by && (
                          <p className="text-[11px] text-[#94A3B8] mt-1">
                            by {doc.verified_by}
                            {doc.verified_at ? ` · ${formatDate(doc.verified_at)}` : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[#64748B] text-xs">{formatDateTime(doc.uploaded_at)}</td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVerify(doc.id, !doc.is_verified)}
                            disabled={verifyingId === doc.id}
                            title={
                              doc.is_verified
                                ? 'Remove verification from this document'
                                : 'Mark this document as verified after checking it'
                            }
                            className={
                              doc.is_verified
                                ? 'flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:bg-gray-50 px-3 py-1.5 rounded-lg border border-[#E2E8F0] transition-colors disabled:opacity-50'
                                : 'flex items-center gap-1.5 text-xs font-medium text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 transition-colors disabled:opacity-50'
                            }
                          >
                            {doc.is_verified ? (
                              <FiX className="w-3.5 h-3.5" />
                            ) : (
                              <FiCheck className="w-3.5 h-3.5" />
                            )}
                            {verifyingId === doc.id
                              ? 'Saving…'
                              : doc.is_verified
                                ? 'Unverify'
                                : 'Verify'}
                          </button>
                          <button
                            onClick={() => handleDownload(doc.id, doc.file_name)}
                            className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Score Breakdown */}
      {activeTab === 'scores' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-5">Overall WSM Score</h2>
            {score === null ? (
              <EmptyState
                title="Not scored yet"
                description="Run scoring for this position from the position detail page to populate the breakdown."
              />
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <ScoreRing score={score} />
                <div className="space-y-2">
                  <Legend color="#16A34A" text="Score ≥ 0.85 — Excellent" />
                  <Legend color="#2563EB" text="Score 0.70–0.84 — Good" />
                  <Legend color="#D97706" text="Score < 0.70 — Needs Review" />
                  <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                    <p className="text-lg font-bold text-[#1E293B]">
                      {formatScore(score)}
                      <span className="text-sm font-normal text-[#64748B] ml-2">
                        ({(score * 100).toFixed(2)}%)
                      </span>
                    </p>
                    <p className="text-xs text-[#64748B]">Position: {application.position?.title ?? '—'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-semibold text-[#1E293B]">Per-Criterion Breakdown</h2>
            </div>
            {rows.length === 0 ? (
              <EmptyState title="No score breakdown available" />
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
                          className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                        >
                          <td className="px-6 py-3.5 font-semibold text-[#1E293B]">{row.criterion_name}</td>
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
        </div>
      )}

      {/* Status History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-6">Status History</h2>
          {application.status_history.length === 0 ? (
            <EmptyState
              title="No status changes yet"
              description="Every status transition is recorded here with the HR member who made it."
            />
          ) : (
            <div className="space-y-0">
              {application.status_history.map((entry, idx) => (
                <div key={entry.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                        idx === 0 ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'
                      }`}
                    />
                    {idx < application.status_history.length - 1 && (
                      <div className="w-0.5 flex-1 bg-[#E2E8F0] my-1" style={{ minHeight: '40px' }} />
                    )}
                  </div>
                  <div className="pb-6 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
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
                    </div>
                    {entry.notes && <p className="text-sm text-[#64748B] mb-1">{entry.notes}</p>}
                    <p className="text-xs text-[#64748B]">
                      Changed by:{' '}
                      <span className="font-semibold text-[#1E293B]">{entry.changed_by ?? '—'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <StatusUpdateModal
          applicationId={applicationId}
          applicantName={applicant?.full_name ?? 'this applicant'}
          currentStatus={application.status}
          onClose={() => setEditing(false)}
          onUpdated={(newStatus) => {
            setEditing(false)
            setNotice(`Status updated to ${newStatus.replace(/_/g, ' ')}.`)
            reload()
          }}
        />
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/admin/applicants"
      className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] font-medium mb-5 transition-colors"
    >
      <FiChevronLeft className="w-4 h-4" />
      Back to Applicants
    </Link>
  )
}

function Field({
  label,
  value,
  node,
}: {
  label: string
  value?: string | null
  node?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{label}</p>
      {node ? <div>{node}</div> : <p className="text-sm text-[#1E293B] font-medium">{value || '—'}</p>}
    </div>
  )
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex gap-2 items-center">
      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
      <span className="text-sm text-[#64748B]">{text}</span>
    </div>
  )
}
