'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import { applicants, scoreBreakdown, applicantDocuments } from '@/lib/directorData'

type Tab = 'profile' | 'score' | 'documents'

export default function ApplicantProfilePage() {
  const [tab, setTab] = useState<Tab>('profile')
  const applicant = applicants[0] // Juan dela Cruz

  const initials = applicant.firstName.charAt(0) + applicant.lastName.charAt(0)

  return (
    <div className="p-8">
      {/* Back link */}
      <Link href="/director/positions/pos-001" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] mb-4">
        <FiArrowLeft className="w-4 h-4" />
        Back to Position
      </Link>

      {/* Read-only banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-2.5">
        <FiLock className="w-4 h-4 text-amber-700 flex-shrink-0" />
        <p className="text-xs text-amber-900">
          <span className="font-semibold">Read-only view.</span> Director access permits review of applicant information without modification.
        </p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-[#1E3A8A] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">{initials}</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">{applicant.fullName}</h1>
              <StatusBadge status={applicant.type} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-[#64748B] mb-3">
              <span className="flex items-center gap-1.5">
                <FiMail className="w-3.5 h-3.5" />
                {applicant.email}
              </span>
              <span className="flex items-center gap-1.5">
                <FiPhone className="w-3.5 h-3.5" />
                {applicant.phone}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={applicant.status} />
              <span className="text-xs text-[#64748B] bg-[#F8FAFF] border border-[#E2E8F0] rounded-full px-2.5 py-0.5">
                Applied to {applicant.positionTitle}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">WSM Score</p>
            <p className="text-3xl font-bold text-[#2563EB] font-mono">{applicant.wsmScore.toFixed(4)}</p>
            <p className="text-xs text-[#64748B]">{(applicant.wsmScore * 100).toFixed(2)}%</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="border-b border-[#E2E8F0] px-6 flex gap-1">
          {([
            { id: 'profile', label: 'Profile Info', icon: FiUser },
            { id: 'score', label: 'Score Breakdown', icon: FiBarChart2 },
            { id: 'documents', label: 'Documents', icon: FiFileText },
          ] as { id: Tab; label: string; icon: typeof FiUser }[]).map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  tab === t.id
                    ? 'flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#2563EB] border-b-2 border-[#2563EB] -mb-px'
                    : 'flex items-center gap-2 px-4 py-3 text-sm font-medium text-[#64748B] hover:text-[#1E293B] border-b-2 border-transparent -mb-px'
                }
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="p-6">
          {tab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <Field label="Full Name" value={applicant.fullName} />
              <Field label="Email" value={applicant.email} />
              <Field label="Phone" value={applicant.phone} />
              <Field label="Applicant Type" value={applicant.type === 'external' ? 'External' : 'Internal'} />
              <Field label="Position Applied" value={applicant.positionTitle} />
              <Field
                label="Profile Completed"
                value={applicant.profileCompleted ? 'Yes' : 'No'}
              />
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">Summary</p>
                <p className="text-sm text-[#1E293B] leading-relaxed">{applicant.summary}</p>
              </div>
            </div>
          )}

          {tab === 'score' && (
            <div>
              {/* Big score display */}
              <div className="flex items-center justify-center mb-7">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#E2E8F0" strokeWidth="10" fill="none" />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#2563EB"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56 * applicant.wsmScore} ${2 * Math.PI * 56}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-[#1E293B]">{(applicant.wsmScore * 100).toFixed(1)}%</span>
                      <span className="text-xs text-[#64748B] font-mono">{applicant.wsmScore.toFixed(4)}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#1E293B]">Total WSM Score</p>
                </div>
              </div>

              {/* Breakdown table */}
              <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Criterion</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Weight</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Raw Value</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Normalized</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Weighted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreBreakdown.map((row, idx) => (
                      <tr key={row.criterionName} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}>
                        <td className="px-4 py-3 font-medium text-[#1E293B]">{row.criterionName}</td>
                        <td className="px-4 py-3 text-[#64748B] font-mono text-xs">{(row.weight * 100).toFixed(0)}%</td>
                        <td className="px-4 py-3 text-[#1E293B]">{row.rawValue}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#1E293B]">{row.normalizedScore.toFixed(4)}</span>
                            <div className="w-16 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#2563EB]"
                                style={{ width: `${row.normalizedScore * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1E293B]">
                          {row.weightedScore.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#DBEAFE] border-t-2 border-[#2563EB]">
                      <td colSpan={4} className="px-4 py-3 font-bold text-[#1E3A8A] text-right">Total WSM Score</td>
                      <td className="px-4 py-3 font-bold text-[#1E3A8A] font-mono">
                        {scoreBreakdown.reduce((sum, r) => sum + r.weightedScore, 0).toFixed(4)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'documents' && (
            <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Document Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">File Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Size</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Verified</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applicantDocuments.map((doc, idx) => (
                    <tr key={doc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}>
                      <td className="px-4 py-3 font-medium text-[#1E293B]">{doc.documentType}</td>
                      <td className="px-4 py-3 text-[#1E293B] text-xs font-mono">{doc.fileName}</td>
                      <td className="px-4 py-3 text-[#64748B] text-xs">{doc.fileSize}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={doc.verified} />
                      </td>
                      <td className="px-4 py-3">
                        <button className="inline-flex items-center gap-1.5 text-[#2563EB] hover:text-[#1E3A8A] text-xs font-semibold">
                          <FiDownload className="w-3.5 h-3.5" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-[#1E293B]">{value}</p>
    </div>
  )
}
