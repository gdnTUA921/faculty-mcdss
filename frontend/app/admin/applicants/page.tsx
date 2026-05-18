'use client'

import { useState } from 'react'
import {
  FiEye,
  FiEdit2,
  FiFileText,
  FiChevronDown,
  FiArchive,
} from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { applicants, positions, departments } from '@/lib/adminData'

type ApplicantTab = 'external' | 'internal'

export default function ApplicantsPage() {
  const [activeTab, setActiveTab] = useState<ApplicantTab>('external')
  const [positionFilter, setPositionFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roundFilter, setRoundFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const typeFiltered = applicants.filter((a) => a.type === activeTab)

  const filtered = typeFiltered.filter((a) => {
    if (positionFilter !== 'all' && a.positionId !== positionFilter) return false
    if (deptFilter !== 'all' && a.department !== deptFilter) return false
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (roundFilter !== 'all' && a.hiringRound !== roundFilter) return false
    return true
  })

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)))
    }
  }

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length

  return (
    <div className="p-8">
      <PageHeader
        title="Applicants"
        subtitle="Review and manage all applicant submissions"
      />

      {/* Tabs */}
      <div className="border-b border-[#E2E8F0] mb-6">
        <div className="flex gap-0">
          {(['external', 'internal'] as ApplicantTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedIds(new Set()) }}
              className={
                activeTab === tab
                  ? 'px-5 py-3 text-sm font-semibold text-[#2563EB] border-b-2 border-[#2563EB] -mb-px transition-colors capitalize'
                  : 'px-5 py-3 text-sm font-medium text-[#64748B] hover:text-[#1E293B] border-b-2 border-transparent -mb-px transition-colors capitalize'
              }
            >
              {tab === 'external' ? 'External Applicants' : 'Internal Staff'}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {applicants.filter((a) => a.type === tab).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position</label>
          <div className="relative">
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Positions</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-2 top-2 w-4 h-4 text-[#64748B] pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Department</label>
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.code}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-2 top-2 w-4 h-4 text-[#64748B] pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="for_review">For Review</option>
              <option value="for_interview">For Interview</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <FiChevronDown className="absolute right-2 top-2 w-4 h-4 text-[#64748B] pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Round</label>
          <div className="relative">
            <select
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value)}
              className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Rounds</option>
              <option value="AY 2025-2026 First Semester">AY 2025-2026 1st Sem</option>
              <option value="AY 2024-2025 Second Semester">AY 2024-2025 2nd Sem</option>
            </select>
            <FiChevronDown className="absolute right-2 top-2 w-4 h-4 text-[#64748B] pointer-events-none" />
          </div>
        </div>

        <span className="ml-auto text-sm text-[#64748B]">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-4">
          <span className="text-sm font-semibold text-[#2563EB]">{selectedIds.size} selected</span>
          <button className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
            <FiArchive className="w-4 h-4" />
            Move to Pool
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-[#64748B] hover:text-[#1E293B]"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#2563EB] accent-[#2563EB]"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Dept</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide w-44">WSM Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applied</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#64748B]">
                    No applicants match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((app, idx) => (
                  <tr
                    key={app.id}
                    className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                  >
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleSelect(app.id)}
                        className="w-4 h-4 rounded border-gray-300 accent-[#2563EB]"
                      />
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#1E293B]">{app.fullName}</td>
                    <td className="px-4 py-3.5 text-[#64748B] text-xs">{app.positionTitle}</td>
                    <td className="px-4 py-3.5 text-[#64748B] text-xs font-semibold">{app.department}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#1E293B] w-14">{app.wsmScore.toFixed(4)}</span>
                        <div className="flex-1 bg-[#E2E8F0] rounded-full h-1.5 min-w-[40px]">
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
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/applicants/${app.id}`}
                          className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors"
                          title="View Profile"
                        >
                          <FiEye className="w-4 h-4" />
                        </a>
                        <button
                          className="p-1.5 text-[#64748B] hover:text-[#D97706] hover:bg-amber-50 rounded-md transition-colors"
                          title="Update Status"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors"
                          title="View Documents"
                        >
                          <FiFileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
