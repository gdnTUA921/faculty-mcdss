'use client'

import {
  FiBriefcase,
  FiUsers,
  FiClipboard,
  FiCalendar,
  FiPlus,
  FiPlayCircle,
  FiSliders,
  FiChevronRight,
} from 'react-icons/fi'
import StatCard from '@/components/admin/StatCard'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { recentActivity } from '@/lib/adminData'

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DashboardPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        subtitle="AY 2025-2026 First Semester"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={FiBriefcase}
          label="Total Open Positions"
          value={5}
          change="+1 since last month"
          changeType="positive"
          iconBg="bg-blue-100"
        />
        <StatCard
          icon={FiUsers}
          label="Total Applicants"
          value={8}
          change="3 new this week"
          changeType="positive"
          iconBg="bg-indigo-100"
        />
        <StatCard
          icon={FiClipboard}
          label="Pending Reviews"
          value={3}
          change="Awaiting action"
          changeType="neutral"
          iconBg="bg-amber-100"
        />
        <StatCard
          icon={FiCalendar}
          label="Active Round"
          value="AY 2025-26 1st"
          change="Ends Aug 31, 2025"
          changeType="neutral"
          iconBg="bg-green-100"
        />
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity Table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1E293B]">Recent Activity</h2>
            <a
              href="/admin/applicants"
              className="text-sm text-[#2563EB] hover:underline flex items-center gap-1 font-medium"
            >
              View all <FiChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applicant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status Change</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">When</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}
                  >
                    <td className="px-6 py-3 font-medium text-[#1E293B]">{item.applicantName}</td>
                    <td className="px-4 py-3 text-[#64748B] text-xs">{item.position}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={item.previousStatus} />
                        <span className="text-[#64748B] text-xs">→</span>
                        <StatusBadge status={item.newStatus} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#64748B] text-xs whitespace-nowrap">
                      {formatTimestamp(item.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-5">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/admin/positions"
              className="flex items-center gap-3 w-full bg-[#2563EB] text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              <span>Create Position</span>
            </a>
            <a
              href="/admin/hiring-rounds"
              className="flex items-center gap-3 w-full border border-[#2563EB] text-[#2563EB] px-4 py-3 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              <FiPlayCircle className="w-4 h-4" />
              <span>Start New Round</span>
            </a>
            <a
              href="/admin/assignment"
              className="flex items-center gap-3 w-full border border-[#2563EB] text-[#2563EB] px-4 py-3 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              <FiSliders className="w-4 h-4" />
              <span>Run Assignment</span>
            </a>
          </div>

          {/* Divider */}
          <div className="border-t border-[#E2E8F0] my-5" />

          {/* At a Glance */}
          <h3 className="text-sm font-semibold text-[#1E293B] mb-3">At a Glance</h3>
          <ul className="space-y-2">
            <li className="flex justify-between text-sm">
              <span className="text-[#64748B]">Applicants for interview</span>
              <span className="font-semibold text-[#1E293B]">2</span>
            </li>
            <li className="flex justify-between text-sm">
              <span className="text-[#64748B]">Applicants for review</span>
              <span className="font-semibold text-[#1E293B]">2</span>
            </li>
            <li className="flex justify-between text-sm">
              <span className="text-[#64748B]">Hired this round</span>
              <span className="font-semibold text-[#16A34A]">1</span>
            </li>
            <li className="flex justify-between text-sm">
              <span className="text-[#64748B]">Pool members</span>
              <span className="font-semibold text-[#1E293B]">5</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
