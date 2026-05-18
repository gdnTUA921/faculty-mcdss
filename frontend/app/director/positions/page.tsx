import Link from 'next/link'
import { FiEye, FiCalendar } from 'react-icons/fi'
import PageHeader from '@/components/director/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { positions, directorInfo } from '@/lib/directorData'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PositionsPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Positions"
        subtitle={`All positions in ${directorInfo.departmentName} — Read-only`}
      />

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
        <FiCalendar className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
        <div className="text-xs text-[#1E3A8A]">
          <p className="font-semibold">Active Hiring Round: AY 2025-2026 First Semester</p>
          <p className="text-[#64748B] mt-0.5">As an Academic Director, you may view positions and rankings but cannot create or modify them.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFF] border-b border-[#E2E8F0] sticky top-0">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Target Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Slots</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Deadline</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos, idx) => (
                <tr
                  key={pos.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}
                >
                  <td className="px-6 py-3">
                    <Link href={`/director/positions/${pos.id}`} className="font-semibold text-[#1E293B] hover:text-[#2563EB]">
                      {pos.title}
                    </Link>
                    <p className="text-xs text-[#64748B] mt-0.5">{pos.hiringRound}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={pos.targetType} />
                  </td>
                  <td className="px-4 py-3 text-[#1E293B]">
                    <span className="font-semibold">{pos.slotsFilled}</span>
                    <span className="text-[#64748B]"> / {pos.slotsAvailable}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={pos.status} />
                  </td>
                  <td className="px-4 py-3 text-[#64748B] text-xs">{formatDate(pos.deadline)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/director/positions/${pos.id}`}
                      className="inline-flex items-center gap-1.5 text-[#2563EB] hover:text-[#1E3A8A] text-xs font-semibold"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
