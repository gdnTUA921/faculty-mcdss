import Link from 'next/link'
import { FiCalendar, FiArrowRight, FiBriefcase, FiInbox } from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import HiringPipeline from '@/components/applicant/HiringPipeline'
import { myApplications } from '@/lib/applicantData'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function MyApplicationsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight mb-1">
            My Applications
          </h1>
          <p className="text-sm text-[#64748B]">Track the status of all positions you have applied to.</p>
        </div>
        <Link
          href="/applicant/positions"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors w-full sm:w-auto justify-center"
        >
          <FiBriefcase className="w-4 h-4" />
          Browse Open Positions
        </Link>
      </div>

      {myApplications.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-12 text-center">
          <FiInbox className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <p className="text-base font-semibold text-[#1E293B] mb-1">No applications yet</p>
          <p className="text-sm text-[#64748B] mb-4">Start by browsing open positions and applying.</p>
          <Link
            href="/applicant/positions"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors"
          >
            Browse Positions
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myApplications.map((app) => (
            <Link
              key={app.id}
              href={`/applicant/my-applications/${app.id}`}
              className="block bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-6 hover:shadow-md hover:border-[#2563EB] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#1E293B] mb-1">{app.positionTitle}</h3>
                  <p className="text-sm text-[#64748B]">{app.department}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{app.hiringRound}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={app.status} size="md" />
                </div>
              </div>

              <HiringPipeline currentStatus={app.status} />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-5 pt-4 border-t border-[#E2E8F0]">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5" />
                    Applied: <span className="font-semibold text-[#1E293B]">{formatDate(app.appliedAt)}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5" />
                    Last update: <span className="font-semibold text-[#1E293B]">{formatDate(app.lastUpdated)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-[#2563EB]">
                  View Details
                  <FiArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
