'use client'

import { useState } from 'react'
import { FiChevronLeft, FiDownload } from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import {
  applicants,
  scoreBreakdown,
  statusHistory,
  applicantDocuments,
} from '@/lib/adminData'

// Use app-001 (Juan dela Cruz) as the mock applicant profile
const applicant = applicants[0]

type Tab = 'profile' | 'applications' | 'documents' | 'scores' | 'history'

function formatDateTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const r = 48
  const circumference = 2 * Math.PI * r
  const strokeDash = (score * circumference).toFixed(2)
  const color = score >= 0.85 ? '#16A34A' : score >= 0.70 ? '#2563EB' : '#D97706'

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
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile Info' },
    { id: 'applications', label: 'Applications' },
    { id: 'documents', label: 'Documents' },
    { id: 'scores', label: 'Score Breakdown' },
    { id: 'history', label: 'Status History' },
  ]

  const totalWeighted = scoreBreakdown.reduce((s, r) => s + r.weightedScore, 0)

  return (
    <div className="p-8">
      {/* Back button */}
      <a
        href="/admin/applicants"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] font-medium mb-5 transition-colors"
      >
        <FiChevronLeft className="w-4 h-4" />
        Back to Applicants
      </a>

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-[#2563EB] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">{getInitials(applicant.fullName)}</span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#1E293B]">{applicant.fullName}</h1>
              <StatusBadge status={applicant.type} size="md" />
              <StatusBadge status={applicant.status} size="md" />
            </div>
            <p className="text-[#64748B] text-sm mb-2">{applicant.email} · {applicant.phone}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="bg-[#DBEAFE] text-[#2563EB] px-3 py-1 rounded-full text-xs font-semibold">
                Applied to 1 position
              </span>
              <span className="bg-gray-100 text-[#64748B] px-3 py-1 rounded-full text-xs font-semibold">
                {applicant.departmentName}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${applicant.profileCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                Profile {applicant.profileCompleted ? 'Complete' : 'Incomplete'}
              </span>
            </div>
          </div>

          {/* Score chip */}
          <div className="flex flex-col items-center justify-center bg-[#F8FAFF] rounded-xl px-6 py-4 border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">WSM Score</p>
            <p className="text-3xl font-bold text-[#2563EB]">{applicant.wsmScore.toFixed(4)}</p>
            <p className="text-xs text-[#64748B] mt-0.5">{(applicant.wsmScore * 100).toFixed(2)}%</p>
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

      {/* Profile Info Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-5">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
            {[
              { label: 'Full Name', value: applicant.fullName },
              { label: 'Email Address', value: applicant.email },
              { label: 'Phone Number', value: applicant.phone },
              { label: 'Applicant Type', value: <StatusBadge status={applicant.type} /> },
              { label: 'Account Created', value: formatDateTime(applicant.accountCreated + 'T00:00:00') },
              { label: 'Profile Completed', value: applicant.profileCompleted ? 'Yes' : 'No' },
              { label: 'Department', value: applicant.departmentName },
              { label: 'Hiring Round', value: applicant.hiringRound },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{item.label}</p>
                {typeof item.value === 'string' ? (
                  <p className="text-sm text-[#1E293B] font-medium">{item.value}</p>
                ) : (
                  <div>{item.value}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-base font-semibold text-[#1E293B]">Application History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Hiring Round</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">WSM Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applied Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-6 py-4 font-semibold text-[#1E293B]">{applicant.positionTitle}</td>
                  <td className="px-4 py-4 text-[#64748B] text-xs">{applicant.hiringRound}</td>
                  <td className="px-4 py-4"><StatusBadge status={applicant.status} /></td>
                  <td className="px-4 py-4 font-semibold text-[#2563EB]">{applicant.wsmScore.toFixed(4)}</td>
                  <td className="px-4 py-4 text-[#64748B] text-xs">{applicant.appliedDate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-base font-semibold text-[#1E293B]">Submitted Documents</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Document Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">File Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Size</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Verified</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Uploaded At</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {applicantDocuments.map((doc, idx) => (
                  <tr
                    key={doc.id}
                    className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                  >
                    <td className="px-6 py-3.5 font-semibold text-[#1E293B]">{doc.documentType}</td>
                    <td className="px-4 py-3.5 text-[#64748B] font-mono text-xs">{doc.fileName}</td>
                    <td className="px-4 py-3.5 text-[#64748B] text-xs">{doc.fileSize}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={doc.verified} /></td>
                    <td className="px-4 py-3.5 text-[#64748B] text-xs">{formatDateTime(doc.uploadedAt)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        disabled
                        className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] bg-gray-100 px-3 py-1.5 rounded-lg cursor-not-allowed opacity-60 ml-auto"
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Score Breakdown Tab */}
      {activeTab === 'scores' && (
        <div className="space-y-5">
          {/* Score display */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-5">Overall WSM Score</h2>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ScoreRing score={applicant.wsmScore} />
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <span className="w-3 h-3 rounded-full bg-[#16A34A] inline-block" />
                  <span className="text-sm text-[#64748B]">Score ≥ 0.85 — Excellent</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="w-3 h-3 rounded-full bg-[#2563EB] inline-block" />
                  <span className="text-sm text-[#64748B]">Score 0.70–0.84 — Good</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="w-3 h-3 rounded-full bg-[#D97706] inline-block" />
                  <span className="text-sm text-[#64748B]">Score &lt; 0.70 — Needs Review</span>
                </div>
                <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                  <p className="text-lg font-bold text-[#1E293B]">
                    {applicant.wsmScore.toFixed(4)}
                    <span className="text-sm font-normal text-[#64748B] ml-2">
                      ({(applicant.wsmScore * 100).toFixed(2)}%)
                    </span>
                  </p>
                  <p className="text-xs text-[#64748B]">Position: {applicant.positionTitle}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Per-criterion table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-semibold text-[#1E293B]">Per-Criterion Breakdown</h2>
            </div>
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
                  {scoreBreakdown.map((row, idx) => (
                    <tr
                      key={row.criterionName}
                      className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                    >
                      <td className="px-6 py-3.5 font-semibold text-[#1E293B]">{row.criterionName}</td>
                      <td className="px-4 py-3.5 text-[#64748B] font-semibold">{Math.round(row.weight * 100)}%</td>
                      <td className="px-4 py-3.5 text-[#1E293B]">{row.rawValue}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#1E293B] w-10">{row.normalizedScore.toFixed(2)}</span>
                          <div className="flex-1 bg-[#E2E8F0] rounded-full h-1.5 min-w-[60px]">
                            <div
                              className="bg-[#2563EB] h-1.5 rounded-full"
                              style={{ width: `${row.normalizedScore * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#2563EB]">{row.weightedScore.toFixed(4)}</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-[#DBEAFE] border-t-2 border-[#2563EB]">
                    <td className="px-6 py-3.5 font-bold text-[#1E293B]" colSpan={4}>Total WSM Score</td>
                    <td className="px-4 py-3.5 font-bold text-[#2563EB] text-base">{totalWeighted.toFixed(4)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Status History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-6">Status History</h2>
          <div className="space-y-0">
            {statusHistory.map((entry, idx) => (
              <div key={entry.id} className="flex gap-4">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${idx === 0 ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'}`} />
                  {idx < statusHistory.length - 1 && (
                    <div className="w-0.5 flex-1 bg-[#E2E8F0] my-1" style={{ minHeight: '40px' }} />
                  )}
                </div>
                {/* Content */}
                <div className={`pb-6 flex-1 ${idx < statusHistory.length - 1 ? '' : ''}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {entry.previousStatus && (
                      <>
                        <StatusBadge status={entry.previousStatus} />
                        <span className="text-[#64748B] text-sm">→</span>
                      </>
                    )}
                    <StatusBadge status={entry.newStatus} />
                    <span className="text-xs text-[#64748B] ml-auto">{formatDateTime(entry.timestamp)}</span>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-[#64748B] mb-1">{entry.notes}</p>
                  )}
                  <p className="text-xs text-[#64748B]">
                    Changed by: <span className="font-semibold text-[#1E293B]">{entry.changedBy}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
