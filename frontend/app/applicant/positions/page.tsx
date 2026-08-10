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
  FiSearch,
  FiCheckCircle,
  FiEdit3,
} from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import { EmptyState, ErrorState, Spinner } from '@/components/shared/DataState'
import { getOpenPositions } from '@/lib/api/applicant'
import { daysUntil, formatDate } from '@/lib/format'
import { useResource } from '@/lib/useResource'

export default function PositionsPage() {
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dept, setDept] = useState('all')

  const { data: positions, loading, error, reload } = useResource(
    () => getOpenPositions({ search: searchTerm || undefined }),
    [searchTerm],
  )

  const all = positions ?? []

  // Options come from what's actually on offer, so the filter never lists a
  // department with no eligible openings.
  const departmentOptions = Array.from(
    new Map(all.filter((p) => p.department).map((p) => [p.department!.id, p.department!])).values(),
  ).sort((a, b) => a.name.localeCompare(b.name))

  const filtered = dept === 'all' ? all : all.filter((p) => p.department?.id === dept)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight mb-1">
          Open Positions
        </h1>
        <p className="text-sm text-[#64748B]">
          Only positions open to your applicant type are shown.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 sm:hidden">
          <FiFilter className="w-4 h-4 text-[#64748B]" />
          <p className="text-sm font-semibold text-[#1E293B]">Filters</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="search"
              className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5"
            >
              Search
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setSearchTerm(search.trim())
              }}
              className="relative"
            >
              <FiSearch className="absolute left-3 top-3.5 w-4 h-4 text-[#64748B]" />
              <input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by position title…"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
            </form>
          </div>

          <div>
            <label
              htmlFor="dept"
              className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5"
            >
              Department
            </label>
            <select
              id="dept"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departmentOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {!loading && (
          <p className="text-xs text-[#64748B] mt-3">
            {filtered.length} position{filtered.length !== 1 ? 's' : ''} match your filters
          </p>
        )}
      </div>

      {error ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : loading ? (
        <Spinner label="Loading positions…" />
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl">
          <EmptyState
            title="No positions found"
            description="There are no open positions matching your filters that accept your applicant type right now."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filtered.map((pos) => {
            const remaining = Math.max(pos.slots_available - pos.slots_filled, 0)
            const days = daysUntil(pos.application_deadline)
            const closingSoon = days !== null && days >= 0 && days <= 7

            return (
              <div
                key={pos.id}
                className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-6 hover:shadow-md hover:border-[#2563EB] transition-all flex flex-col"
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="w-11 h-11 rounded-lg bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                    <FiBriefcase className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <StatusBadge status={pos.target_applicant_type} />
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#1E293B] mb-1">{pos.title}</h3>
                <p className="text-xs text-[#64748B] flex items-center gap-1.5 mb-3">
                  <FiMapPin className="w-3.5 h-3.5" />
                  {pos.department?.name ?? '—'}
                </p>

                <p className="text-sm text-[#475569] leading-relaxed line-clamp-3 mb-4 flex-1">
                  {pos.description || 'No description provided.'}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs mb-4">
                  <span className="flex items-center gap-1.5 text-[#64748B]">
                    <FiUsers className="w-3.5 h-3.5" />
                    <span className="font-semibold text-[#1E293B]">{remaining}</span> slot
                    {remaining !== 1 ? 's' : ''} remaining
                  </span>
                  <span className="flex items-center gap-1.5 text-[#64748B]">
                    <FiCalendar className="w-3.5 h-3.5" />
                    {pos.application_deadline ? (
                      <>
                        Apply by{' '}
                        <span
                          className={`font-semibold ${closingSoon ? 'text-[#D97706]' : 'text-[#1E293B]'}`}
                        >
                          {formatDate(pos.application_deadline)}
                        </span>
                        {closingSoon && (
                          <span className="text-[#D97706] font-semibold">
                            ({days === 0 ? 'today' : `${days}d left`})
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="font-semibold text-[#1E293B]">No deadline set</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 text-[#64748B]">
                    {pos.criteria_count} evaluation criteria
                  </span>
                </div>

                {pos.has_applied ? (
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E2E8F0]">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#16A34A]">
                      <FiCheckCircle className="w-4 h-4" />
                      Already applied
                    </span>
                    <StatusBadge status={pos.application_status ?? 'applied'} />
                  </div>
                ) : pos.application_status === 'draft' ? (
                  <Link
                    href={`/applicant/apply/${pos.id}/upload`}
                    className="flex items-center justify-center gap-2 w-full bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-100 transition-colors"
                  >
                    <FiEdit3 className="w-4 h-4" />
                    Continue your draft
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                ) : pos.criteria_count === 0 ? (
                  <div className="pt-3 border-t border-[#E2E8F0]">
                    <p className="text-xs text-[#94A3B8]">
                      Not accepting applications yet — evaluation criteria are still being configured.
                    </p>
                  </div>
                ) : (
                  <Link
                    href={`/applicant/apply/${pos.id}/upload`}
                    className="flex items-center justify-center gap-2 w-full bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors"
                  >
                    Apply Now
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
