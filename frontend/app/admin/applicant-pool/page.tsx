'use client'

import { useState } from 'react'
import {
  FiMail,
  FiX,
  FiChevronDown,
} from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { poolMembers, departments } from '@/lib/adminData'

export default function ApplicantPoolPage() {
  const [roundFilter, setRoundFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = poolMembers.filter((m) => {
    if (deptFilter !== 'all' && m.department !== deptFilter) return false
    if (statusFilter !== 'all' && m.poolStatus !== statusFilter) return false
    return true
  })

  const activeCount = poolMembers.filter((m) => m.poolStatus === 'pool_active').length
  const reengagedCount = poolMembers.filter((m) => m.poolStatus === 'reengaged').length
  const inactiveCount = poolMembers.filter((m) => m.poolStatus === 'pool_inactive').length

  function renderConfirmedInterest(val: string) {
    if (val === 'yes') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Yes</span>
    }
    if (val === 'no') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">No</span>
    }
    return <StatusBadge status="pending" />
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Applicant Pool"
        subtitle="Manage previous applicants retained for future consideration"
      />

      {/* Summary Stats */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm px-5 py-3 flex items-center gap-3">
          <div className="w-2 h-8 rounded-full bg-[#2563EB]" />
          <div>
            <p className="text-2xl font-bold text-[#1E293B]">{activeCount}</p>
            <p className="text-xs text-[#64748B] font-medium">Active Pool Members</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm px-5 py-3 flex items-center gap-3">
          <div className="w-2 h-8 rounded-full bg-[#16A34A]" />
          <div>
            <p className="text-2xl font-bold text-[#1E293B]">{reengagedCount}</p>
            <p className="text-xs text-[#64748B] font-medium">Re-engaged</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm px-5 py-3 flex items-center gap-3">
          <div className="w-2 h-8 rounded-full bg-[#CBD5E1]" />
          <div>
            <p className="text-2xl font-bold text-[#1E293B]">{inactiveCount}</p>
            <p className="text-xs text-[#64748B] font-medium">Inactive</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Round</label>
          <div className="relative">
            <select
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value)}
              className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Rounds</option>
              <option value="AY 2024-2025 Second Semester">AY 2024-2025 2nd Sem</option>
              <option value="AY 2024-2025 First Semester">AY 2024-2025 1st Sem</option>
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
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Pool Status</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Statuses</option>
              <option value="pool_active">Active</option>
              <option value="reengaged">Re-engaged</option>
              <option value="pool_inactive">Inactive</option>
            </select>
            <FiChevronDown className="absolute right-2 top-2 w-4 h-4 text-[#64748B] pointer-events-none" />
          </div>
        </div>

        <span className="ml-auto text-sm text-[#64748B]">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[#64748B] text-sm font-medium">No pool members match the selected filters.</p>
            <p className="text-[#64748B] text-xs mt-1">Try adjusting your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applicant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Original Position</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Dept</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Original Round</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Pool Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Re-engagement</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Confirmed Interest</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member, idx) => (
                  <tr
                    key={member.id}
                    className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-[#1E293B]">{member.applicantName}</p>
                      <p className="text-xs text-[#64748B]">{member.email}</p>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={member.type} /></td>
                    <td className="px-4 py-3.5 text-[#64748B] text-xs">{member.originalPosition}</td>
                    <td className="px-4 py-3.5 text-[#64748B] text-xs font-semibold">{member.department}</td>
                    <td className="px-4 py-3.5 text-[#64748B] text-xs">{member.originalRound}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={member.poolStatus} /></td>
                    <td className="px-4 py-3.5">
                      {member.reengagementSent ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Sent</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Not Sent</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">{renderConfirmedInterest(member.confirmedInterest)}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors border border-blue-200 whitespace-nowrap">
                          <FiMail className="w-3.5 h-3.5" />
                          Re-engage
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors border border-[#E2E8F0] whitespace-nowrap">
                          <FiX className="w-3.5 h-3.5" />
                          Inactive
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
    </div>
  )
}
