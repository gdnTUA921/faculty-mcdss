import Link from 'next/link'
import { FiArrowLeft, FiEye, FiCalendar, FiBriefcase, FiUsers } from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import { positions, applicants } from '@/lib/directorData'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PositionDetailPage() {
  // Use the first DIT position (pos-001) as the displayed position for this read-only view
  const position = positions[0]
  const positionApplicants = applicants
    .filter((a) => a.positionId === position.id)
    .sort((a, b) => b.wsmScore - a.wsmScore)

  return (
    <div className="p-8">
      {/* Back link */}
      <Link href="/director/positions" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] mb-4">
        <FiArrowLeft className="w-4 h-4" />
        Back to Positions
      </Link>

      {/* Position Header Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={position.status} />
              <StatusBadge status={position.targetType} />
            </div>
            <h1 className="text-2xl font-bold text-[#1E293B] mb-1 tracking-tight">{position.title}</h1>
            <p className="text-sm text-[#64748B]">{position.departmentName}</p>
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Slots Filled</p>
              <p className="text-lg font-bold text-[#1E293B]">
                {position.slotsFilled}<span className="text-[#64748B] font-normal"> / {position.slotsAvailable}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Deadline</p>
              <div className="flex items-center gap-1.5 text-[#1E293B]">
                <FiCalendar className="w-4 h-4 text-[#64748B]" />
                <p className="font-semibold">{formatDate(position.deadline)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Hiring Round</p>
              <p className="font-semibold text-[#1E293B]">{position.hiringRound}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FiBriefcase className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-base font-semibold text-[#1E293B]">Position Description</h2>
        </div>
        <p className="text-sm text-[#1E293B] leading-relaxed">{position.description}</p>
      </div>

      {/* Ranked Applicants */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiUsers className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-base font-semibold text-[#1E293B]">Ranked Applicants</h2>
            <span className="text-xs text-[#64748B]">({positionApplicants.length})</span>
          </div>
          <p className="text-xs text-[#64748B]">Sorted by WSM Score</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Rank</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applicant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">WSM Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applied</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {positionApplicants.map((applicant, idx) => (
                <tr
                  key={applicant.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}
                >
                  <td className="px-6 py-3">
                    <div className={`w-7 h-7 rounded-full ${idx === 0 ? 'bg-[#2563EB] text-white' : 'bg-[#DBEAFE] text-[#1E3A8A]'} flex items-center justify-center text-xs font-bold`}>
                      {idx + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1E293B]">{applicant.fullName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={applicant.type} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-[#1E293B] text-xs">
                        {applicant.wsmScore.toFixed(4)}
                      </span>
                      <div className="w-24 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB] rounded-full"
                          style={{ width: `${applicant.wsmScore * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#64748B] font-mono">
                        {(applicant.wsmScore * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={applicant.status} />
                  </td>
                  <td className="px-4 py-3 text-[#64748B] text-xs">{formatDate(applicant.appliedDate)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/applicants/${applicant.id}`}
                      className="inline-flex items-center gap-1.5 text-[#2563EB] hover:text-[#1E3A8A] text-xs font-semibold"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      View Profile
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
