import {
  FiBriefcase,
  FiUsers,
  FiCheckCircle,
  FiClipboard,
  FiChevronRight,
} from 'react-icons/fi'
import StatCard from '@/components/director/StatCard'
import PageHeader from '@/components/director/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { recentActivity, directorInfo } from '@/lib/directorData'

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DirectorDashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-1 text-xs font-semibold text-[#2563EB] uppercase tracking-wider">
        Director View
      </div>
      <PageHeader
        title={directorInfo.departmentName}
        subtitle="AY 2025-2026 First Semester — Read-only overview"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={FiBriefcase}
          label="Open Positions"
          value={2}
          change="In your department"
          iconBg="bg-blue-100"
        />
        <StatCard
          icon={FiUsers}
          label="Total Applicants"
          value={5}
          change="This round"
          iconBg="bg-indigo-100"
        />
        <StatCard
          icon={FiCheckCircle}
          label="Hired This Round"
          value={1}
          change="Pending confirmation"
          changeType="positive"
          iconBg="bg-green-100"
        />
        <StatCard
          icon={FiClipboard}
          label="Pending Reviews"
          value={1}
          change="Awaiting committee"
          iconBg="bg-amber-100"
        />
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity Table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#1E293B]">Recent Department Activity</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Latest status changes for {directorInfo.departmentCode} applicants</p>
            </div>
            <a
              href="/director/positions"
              className="text-sm text-[#2563EB] hover:underline flex items-center gap-1 font-medium"
            >
              View positions <FiChevronRight className="w-3.5 h-3.5" />
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
                        {item.previousStatus && (
                          <>
                            <StatusBadge status={item.previousStatus} />
                            <span className="text-[#64748B] text-xs">→</span>
                          </>
                        )}
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

        {/* Department Summary Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-5">Department Overview</h2>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Department</p>
              <p className="text-sm font-semibold text-[#1E293B]">{directorInfo.departmentName}</p>
              <p className="text-xs text-[#64748B]">Code: {directorInfo.departmentCode}</p>
            </div>

            <div className="border-t border-[#E2E8F0] pt-4">
              <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Director</p>
              <p className="text-sm font-semibold text-[#1E293B]">{directorInfo.name}</p>
              <p className="text-xs text-[#64748B]">{directorInfo.email}</p>
            </div>

            <div className="border-t border-[#E2E8F0] pt-4">
              <p className="text-xs text-[#64748B] uppercase tracking-wide mb-2">At a Glance</p>
              <ul className="space-y-2">
                <li className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Applicants for interview</span>
                  <span className="font-semibold text-[#1E293B]">2</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Applicants for review</span>
                  <span className="font-semibold text-[#1E293B]">1</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Hired this round</span>
                  <span className="font-semibold text-[#16A34A]">1</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Faculty workload entries</span>
                  <span className="font-semibold text-[#1E293B]">4</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
