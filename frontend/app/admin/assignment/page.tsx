'use client'

import { useState } from 'react'
import {
  FiPlay,
  FiX,
  FiDownload,
  FiChevronDown,
  FiCheckCircle,
} from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { assignmentRun, assignmentResults, facultyWorkload, departments } from '@/lib/adminData'

const DEPT_OPTIONS = departments.map((d) => d.code)

export default function AssignmentPage() {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [applicantType, setApplicantType] = useState('all')
  const [selectedDepts, setSelectedDepts] = useState<string[]>(DEPT_OPTIONS)
  const [showDeptDropdown, setShowDeptDropdown] = useState(false)
  const [hasRun, setHasRun] = useState(true) // show mock result

  function toggleDept(code: string) {
    setSelectedDepts((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]
    )
  }

  function handleRunConfirm() {
    setShowConfirmModal(false)
    setHasRun(true)
  }

  function formatDateTime(ts: string) {
    return new Date(ts).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Assignment"
        subtitle="ILP-Based Candidate Selection & Faculty Allocation"
      />

      {/* Section 1 — Configure & Run */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-[#1E293B] mb-4">Configure & Run Assignment</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Applicant Type */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Applicant Type</label>
            <div className="relative">
              <select
                value={applicantType}
                onChange={(e) => setApplicantType(e.target.value)}
                className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white"
              >
                <option value="all">All (External + Internal)</option>
                <option value="external">External Only</option>
                <option value="internal">Internal Only</option>
              </select>
              <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
            </div>
          </div>

          {/* Departments */}
          <div className="relative">
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Departments</label>
            <button
              type="button"
              onClick={() => setShowDeptDropdown(!showDeptDropdown)}
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
            >
              <span>
                {selectedDepts.length === DEPT_OPTIONS.length
                  ? 'All Departments'
                  : selectedDepts.length === 0
                  ? 'None selected'
                  : `${selectedDepts.length} selected`}
              </span>
              <FiChevronDown className="w-4 h-4 text-[#64748B]" />
            </button>
            {showDeptDropdown && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-3 w-56 space-y-1.5">
                {DEPT_OPTIONS.map((code) => (
                  <label key={code} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md">
                    <input
                      type="checkbox"
                      checked={selectedDepts.includes(code)}
                      onChange={() => toggleDept(code)}
                      className="w-3.5 h-3.5 accent-[#2563EB]"
                    />
                    <span className="text-sm text-[#1E293B]">{code}</span>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setShowDeptDropdown(false)}
                  className="w-full mt-2 text-xs text-[#2563EB] font-semibold text-left px-2 py-1 hover:bg-blue-50 rounded-md"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Positions */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Positions</label>
            <div className="relative">
              <select className="w-full appearance-none border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white">
                <option>All Open Positions (5)</option>
                <option>Assistant Professor I — DIT</option>
                <option>Instructor III — COE</option>
                <option>Associate Professor II — CBA</option>
                <option>Instructor I — DNS</option>
                <option>Assistant Professor III — COE</option>
              </select>
              <FiChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Last run status */}
        <div className="flex flex-wrap items-center gap-4 mb-5 p-3 bg-[#F8FAFF] rounded-lg border border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-[#16A34A]" />
            <span className="text-sm text-[#64748B]">Last run:</span>
            <StatusBadge status="completed" />
          </div>
          <span className="text-sm text-[#64748B]">{formatDateTime(assignmentRun.runAt)}</span>
          <span className="text-sm text-[#64748B]">
            Objective Score: <span className="font-semibold text-[#1E293B]">{assignmentRun.objectiveScore.toFixed(4)}</span>
          </span>
        </div>

        {/* Run Button */}
        <button
          onClick={() => setShowConfirmModal(true)}
          className="flex items-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FiPlay className="w-4 h-4" />
          Run Assignment Algorithm
        </button>
      </div>

      {/* Section 2 — Results */}
      {hasRun && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold text-[#1E293B]">Assignment Results</h2>
            <span className="text-xs text-[#64748B]">Latest Run — {formatDateTime(assignmentRun.runAt)}</span>
            <StatusBadge status="completed" />
          </div>

          {/* Summary bar */}
          <div className="px-6 py-3 bg-[#F8FAFF] border-b border-[#E2E8F0] flex flex-wrap gap-6 text-sm">
            <span className="text-[#64748B]">
              <span className="font-bold text-[#16A34A]">{assignmentRun.totalAssigned}</span> applicants assigned
            </span>
            <span className="text-[#64748B]">
              <span className="font-bold text-[#2563EB]">{assignmentRun.positionsFullyFilled}</span> positions fully filled
            </span>
            <span className="text-[#64748B]">
              Objective Score: <span className="font-bold text-[#1E293B]">{assignmentRun.objectiveScore.toFixed(4)}</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applicant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Dept</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">WSM Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Assigned</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Objective Score</th>
                </tr>
              </thead>
              <tbody>
                {assignmentResults.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                  >
                    <td className="px-6 py-3.5 font-semibold text-[#1E293B]">{r.applicantName}</td>
                    <td className="px-4 py-3.5 text-[#64748B] text-xs">{r.position}</td>
                    <td className="px-4 py-3.5 text-[#64748B] text-xs font-semibold">{r.department}</td>
                    <td className="px-4 py-3.5 font-semibold text-[#2563EB] text-xs">{r.wsmScore.toFixed(4)}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={r.isAssigned ? 'yes' : 'no'} />
                    </td>
                    <td className="px-4 py-3.5 text-[#1E293B] font-mono text-xs">{r.objectiveScore.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 3 — Faculty Workload */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1E293B]">Faculty Workload Allocation</h2>
          <button className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-[#2563EB]">
            <FiDownload className="w-4 h-4" />
            Export Workload
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Faculty Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Course Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Course Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Units</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Semester</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">AY</th>
              </tr>
            </thead>
            <tbody>
              {facultyWorkload.map((fw, idx) => (
                <tr
                  key={fw.id}
                  className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                >
                  <td className="px-6 py-3.5 font-semibold text-[#1E293B]">{fw.facultyName}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-[#2563EB] font-semibold">{fw.courseCode}</td>
                  <td className="px-4 py-3.5 text-[#64748B]">{fw.courseName}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-block bg-[#DBEAFE] text-[#2563EB] px-2 py-0.5 rounded-full text-xs font-bold">{fw.units}</span>
                  </td>
                  <td className="px-4 py-3.5 text-[#64748B] text-xs">{fw.semester}</td>
                  <td className="px-4 py-3.5 text-[#64748B] text-xs">{fw.academicYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-lg font-bold text-[#1E293B]">Confirm Assignment Run</h2>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-[#64748B] hover:text-[#1E293B] p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">Please confirm before proceeding</p>
                <p className="text-sm text-amber-700">
                  You are about to run the ILP assignment algorithm for{' '}
                  <strong>{applicantType === 'all' ? 'All (External + Internal)' : applicantType}</strong> applicants
                  across <strong>{selectedDepts.length}</strong> department(s).
                </p>
              </div>
              <div className="space-y-2 text-sm text-[#64748B]">
                <div className="flex justify-between">
                  <span>Applicant scope:</span>
                  <span className="font-semibold text-[#1E293B]">8 applicants</span>
                </div>
                <div className="flex justify-between">
                  <span>Position scope:</span>
                  <span className="font-semibold text-[#1E293B]">5 positions</span>
                </div>
                <div className="flex justify-between">
                  <span>Departments:</span>
                  <span className="font-semibold text-[#1E293B]">{selectedDepts.join(', ')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-gray-50">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 border border-[#E2E8F0] text-[#64748B] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunConfirm}
                className="flex-1 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Confirm & Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
