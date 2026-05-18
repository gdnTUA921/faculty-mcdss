'use client'

import { useState } from 'react'
import {
  FiChevronLeft,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiAlertCircle,
  FiEye,
} from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import { positions, criteria, applicants } from '@/lib/adminData'

// Use the first position (DIT Assistant Professor I) as the detail page
const position = positions[0]
const positionCriteria = criteria.filter((c) => c.positionId === position.id)
const positionApplicants = applicants
  .filter((a) => a.positionId === position.id)
  .sort((a, b) => b.wsmScore - a.wsmScore)

type Tab = 'overview' | 'criteria' | 'applicants'

function WeightBar({ weight }: { weight: number }) {
  const pct = Math.round(weight * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-[#1E293B] w-10 text-right">{pct}%</span>
      <div className="flex-1 bg-[#E2E8F0] rounded-full h-2 min-w-[80px]">
        <div
          className="bg-[#2563EB] h-2 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function PositionDetailPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const totalWeight = positionCriteria.reduce((sum, c) => sum + c.weight, 0)
  const weightOk = Math.abs(totalWeight - 1.0) < 0.001

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'criteria', label: 'Criteria & Weights' },
    { id: 'applicants', label: 'Applicants' },
  ]

  return (
    <div className="p-8">
      {/* Back button */}
      <a
        href="/admin/positions"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] font-medium mb-5 transition-colors"
      >
        <FiChevronLeft className="w-4 h-4" />
        Back to Positions
      </a>

      {/* Position Header Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-[#1E293B]">{position.title}</h1>
              <StatusBadge status={position.status} size="md" />
            </div>
            <p className="text-[#64748B] text-sm mb-3">{position.departmentName}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-[#64748B]">Slots filled: </span>
                <span className="font-semibold text-[#1E293B]">
                  {position.slotsFilled} / {position.slotsAvailable}
                </span>
              </div>
              <div>
                <span className="text-[#64748B]">Deadline: </span>
                <span className="font-semibold text-[#1E293B]">{position.deadline}</span>
              </div>
              <div>
                <span className="text-[#64748B]">Target Type: </span>
                <StatusBadge status={position.targetType} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 border border-[#E2E8F0] text-[#64748B] px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <FiEdit2 className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>

        {/* Slot progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[#64748B] mb-1">
            <span>Slots Progress</span>
            <span>{position.slotsFilled}/{position.slotsAvailable} filled</span>
          </div>
          <div className="w-full bg-[#E2E8F0] rounded-full h-2">
            <div
              className="bg-[#16A34A] h-2 rounded-full transition-all"
              style={{ width: `${(position.slotsFilled / position.slotsAvailable) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#E2E8F0] mb-6">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? 'px-5 py-3 text-sm font-semibold text-[#2563EB] border-b-2 border-[#2563EB] -mb-px transition-colors'
                  : 'px-5 py-3 text-sm font-medium text-[#64748B] hover:text-[#1E293B] border-b-2 border-transparent -mb-px transition-colors'
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-4">Position Description</h2>
          <p className="text-[#64748B] text-sm leading-relaxed mb-6">{position.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-0.5">Created Date</p>
                <p className="text-sm text-[#1E293B] font-medium">{position.createdAt}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-0.5">Department</p>
                <p className="text-sm text-[#1E293B] font-medium">{position.departmentName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-0.5">Target Applicant Type</p>
                <div className="mt-1">
                  <StatusBadge status={position.targetType} />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-0.5">Hiring Round</p>
                <p className="text-sm text-[#1E293B] font-medium">{position.hiringRound}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-0.5">Application Deadline</p>
                <p className="text-sm text-[#1E293B] font-medium">{position.deadline}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-0.5">Current Status</p>
                <div className="mt-1">
                  <StatusBadge status={position.status} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'criteria' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          {/* Weight Sum Indicator */}
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1E293B]">Evaluation Criteria</h2>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
              weightOk
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {weightOk
                ? <FiCheck className="w-4 h-4" />
                : <FiAlertCircle className="w-4 h-4" />
              }
              Total Weight: {Math.round(totalWeight * 100)}%{weightOk ? ' — Valid' : ' — Must equal 100%'}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Criterion Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Data Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide w-48">Weight</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Required</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Range</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {positionCriteria.map((c, idx) => (
                  <tr
                    key={c.id}
                    className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-[#1E293B]">{c.name}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">{c.description}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={c.dataType} />
                    </td>
                    <td className="px-4 py-3.5">
                      <WeightBar weight={c.weight} />
                    </td>
                    <td className="px-4 py-3.5">
                      {c.required ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                          <FiCheck className="w-3 h-3" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#64748B]">
                      {c.minValue !== null && c.maxValue !== null
                        ? `${c.minValue} – ${c.maxValue}`
                        : '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-md transition-colors" title="Delete">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-[#E2E8F0]">
            <button className="flex items-center gap-2 text-[#2563EB] text-sm font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
              <FiPlus className="w-4 h-4" />
              Add Criterion
            </button>
          </div>
        </div>
      )}

      {activeTab === 'applicants' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-base font-semibold text-[#1E293B]">
              Applicants for {position.title}
              <span className="ml-2 text-sm font-normal text-[#64748B]">({positionApplicants.length} total)</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide w-40">WSM Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applied</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {positionApplicants.map((app, idx) => (
                  <tr
                    key={app.id}
                    className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                  >
                    <td className="px-6 py-3.5 font-bold text-[#64748B] text-center w-12">#{idx + 1}</td>
                    <td className="px-4 py-3.5 font-semibold text-[#1E293B]">{app.fullName}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={app.type} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1E293B] text-xs w-14">{app.wsmScore.toFixed(4)}</span>
                        <div className="flex-1 bg-[#E2E8F0] rounded-full h-1.5 min-w-[50px]">
                          <div
                            className="bg-[#2563EB] h-1.5 rounded-full"
                            style={{ width: `${app.wsmScore * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3.5 text-[#64748B] text-xs">{app.appliedDate}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end">
                        <a
                          href={`/applicants/${app.id}`}
                          className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:underline"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                          View Profile
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
