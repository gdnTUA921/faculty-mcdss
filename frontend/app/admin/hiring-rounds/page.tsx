'use client'

import { useState } from 'react'
import {
  FiPlus,
  FiEye,
  FiX,
  FiArchive,
  FiChevronDown,
} from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { hiringRounds } from '@/lib/adminData'

export default function HiringRoundsPage() {
  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formSemester, setFormSemester] = useState('1st Semester')
  const [formYear, setFormYear] = useState('2025-2026')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setShowModal(false)
    setFormName('')
    setFormSemester('1st Semester')
    setFormYear('2025-2026')
    setFormStart('')
    setFormEnd('')
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Hiring Rounds"
        subtitle="Manage academic hiring rounds by semester"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Create Round
          </button>
        }
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Round Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Semester</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Academic Year</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Start Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">End Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hiringRounds.map((round, idx) => (
                <tr
                  key={round.id}
                  className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                >
                  <td className="px-6 py-4 font-semibold text-[#1E293B]">{round.name}</td>
                  <td className="px-4 py-4 text-[#64748B]">{round.semester}</td>
                  <td className="px-4 py-4 text-[#64748B]">{round.academicYear}</td>
                  <td className="px-4 py-4 text-[#64748B] text-xs">{formatDate(round.startDate)}</td>
                  <td className="px-4 py-4 text-[#64748B] text-xs">{formatDate(round.endDate)}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={round.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors"
                        title="View Details"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      {round.status === 'active' && (
                        <button
                          className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-md transition-colors"
                          title="Close Round"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      )}
                      {round.status === 'closed' && (
                        <button
                          className="p-1.5 text-[#64748B] hover:text-[#64748B] hover:bg-gray-100 rounded-md transition-colors"
                          title="Archive Round"
                        >
                          <FiArchive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Round Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-lg font-bold text-[#1E293B]">Create Hiring Round</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#64748B] hover:text-[#1E293B] p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-1">Round Name <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., AY 2026-2027 First Semester"
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1">Semester</label>
                  <div className="relative">
                    <select
                      value={formSemester}
                      onChange={(e) => setFormSemester(e.target.value)}
                      className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white"
                    >
                      <option value="1st Semester">1st Semester</option>
                      <option value="2nd Semester">2nd Semester</option>
                      <option value="Summer">Summer</option>
                    </select>
                    <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    placeholder="e.g., 2026-2027"
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1">End Date</label>
                  <input
                    type="date"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
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
                Create Round
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
