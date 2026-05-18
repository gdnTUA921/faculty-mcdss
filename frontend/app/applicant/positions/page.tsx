'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  FiBriefcase,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiArrowRight,
  FiFilter,
} from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import { openPositions } from '@/lib/applicantData'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const departmentOptions = [
  { value: 'all', label: 'All Departments' },
  { value: 'DIT', label: 'Department of Information Technology' },
  { value: 'COE', label: 'College of Engineering' },
  { value: 'DNS', label: 'Department of Natural Sciences' },
]

const targetOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'external', label: 'External Only' },
  { value: 'internal', label: 'Internal Only' },
  { value: 'both', label: 'Both' },
]

export default function PositionsPage() {
  const [dept, setDept] = useState('all')
  const [target, setTarget] = useState('all')

  const filtered = openPositions.filter((p) => {
    if (dept !== 'all' && p.departmentCode !== dept) return false
    if (target !== 'all' && p.targetType !== target && p.targetType !== 'both') return false
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight mb-1">
          Open Positions
        </h1>
        <p className="text-sm text-[#64748B]">Explore opportunities and apply to roles that match your expertise.</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 sm:hidden">
          <FiFilter className="w-4 h-4 text-[#64748B]" />
          <p className="text-sm font-semibold text-[#1E293B]">Filters</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">Department</label>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            >
              {departmentOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">Applicant Type</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            >
              {targetOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-[#64748B] mt-3">{filtered.length} position(s) match your filters</p>
      </div>

      {/* Position Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {filtered.map((pos) => {
          const remaining = pos.slotsAvailable - pos.slotsFilled
          return (
            <div
              key={pos.id}
              className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-6 hover:shadow-md hover:border-[#2563EB] transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="w-11 h-11 rounded-lg bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                  <FiBriefcase className="w-5 h-5 text-[#2563EB]" />
                </div>
                <StatusBadge status={pos.targetType} />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#1E293B] mb-1">{pos.title}</h3>
              <p className="text-xs text-[#64748B] flex items-center gap-1.5 mb-3">
                <FiMapPin className="w-3.5 h-3.5" />
                {pos.department}
              </p>

              <p className="text-sm text-[#475569] leading-relaxed line-clamp-3 mb-4 flex-1">
                {pos.description}
              </p>

              {/* Meta */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs mb-4">
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  <FiUsers className="w-3.5 h-3.5" />
                  <span className="font-semibold text-[#1E293B]">{remaining}</span> slot{remaining !== 1 ? 's' : ''} remaining
                </span>
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  <FiCalendar className="w-3.5 h-3.5" />
                  Apply by <span className="font-semibold text-[#1E293B]">{formatDate(pos.deadline)}</span>
                </span>
              </div>

              <Link
                href={`/applicant/apply/${pos.id}/upload`}
                className="flex items-center justify-center gap-2 w-full bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors"
              >
                Apply Now
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center">
          <FiBriefcase className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
          <p className="text-base font-semibold text-[#1E293B] mb-1">No positions found</p>
          <p className="text-sm text-[#64748B]">Try adjusting your filters to see more opportunities.</p>
        </div>
      )}
    </div>
  )
}
