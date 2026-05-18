'use client'

import { useState } from 'react'
import {
  FiPlus,
  FiEye,
  FiEdit2,
  FiX,
  FiChevronDown,
} from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { positions, departments } from '@/lib/adminData'

type PositionStatus = 'all' | 'open' | 'closed' | 'filled'
type TargetType = 'all' | 'external' | 'internal' | 'both'

export default function PositionsPage() {
  const [statusFilter, setStatusFilter] = useState<PositionStatus>('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<TargetType>('all')
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDept, setFormDept] = useState('')
  const [formType, setFormType] = useState('both')
  const [formSlots, setFormSlots] = useState('')
  const [formDeadline, setFormDeadline] = useState('')

  const filtered = positions.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (deptFilter !== 'all' && p.department !== deptFilter) return false
    if (typeFilter !== 'all' && p.targetType !== typeFilter) return false
    return true
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setShowModal(false)
    setFormTitle('')
    setFormDesc('')
    setFormDept('')
    setFormType('both')
    setFormSlots('')
    setFormDeadline('')
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Positions"
        subtitle="Manage faculty position listings and criteria"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Create Position
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PositionStatus)}
              className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="filled">Filled</option>
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
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Target Type</label>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TargetType)}
              className="appearance-none border border-[#E2E8F0] rounded-lg px-3 py-1.5 pr-8 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Types</option>
              <option value="external">External</option>
              <option value="internal">Internal</option>
              <option value="both">Both</option>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Department</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Slots</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Deadline</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">
                    No positions match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((pos, idx) => (
                  <tr
                    key={pos.id}
                    className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                  >
                    <td className="px-6 py-3.5 font-semibold text-[#1E293B]">{pos.title}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-[#1E293B]">{pos.department}</span>
                      <p className="text-xs text-[#64748B] mt-0.5 hidden md:block">{pos.departmentName}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={pos.targetType} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[#1E293B] font-medium">{pos.slotsFilled} / {pos.slotsAvailable}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={pos.status} />
                    </td>
                    <td className="px-4 py-3.5 text-[#64748B] text-sm">{pos.deadline}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/admin/positions/${pos.id}`}
                          className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors"
                          title="View"
                        >
                          <FiEye className="w-4 h-4" />
                        </a>
                        <button
                          className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-md transition-colors"
                          title="Close Position"
                        >
                          <FiX className="w-4 h-4" />
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

      {/* Create Position Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-lg font-bold text-[#1E293B]">Create New Position</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#64748B] hover:text-[#1E293B] p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-1">Position Title <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Assistant Professor I"
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Describe the position requirements and responsibilities..."
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1">Department <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      required
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white"
                    >
                      <option value="">Select department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1">Target Applicant Type</label>
                  <div className="relative">
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white"
                    >
                      <option value="both">Both</option>
                      <option value="external">External</option>
                      <option value="internal">Internal</option>
                    </select>
                    <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1">Slots Available <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={formSlots}
                    onChange={(e) => setFormSlots(e.target.value)}
                    placeholder="e.g., 2"
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                  />
                </div>
              </div>
            </form>

            <div className="flex gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-gray-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 border border-[#E2E8F0] text-[#64748B] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Create Position
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
