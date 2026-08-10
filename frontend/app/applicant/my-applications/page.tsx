'use client'

import Link from 'next/link'
import { FiCalendar, FiArrowRight, FiBriefcase, FiFileText, FiEdit3 } from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import HiringPipeline from '@/components/applicant/HiringPipeline'
import { EmptyState, ErrorState, Spinner } from '@/components/shared/DataState'
import { getMyApplications } from '@/lib/api/applicant'
import { formatDate } from '@/lib/format'
import { useResource } from '@/lib/useResource'

export default function MyApplicationsPage() {
  const { data, loading, error, reload } = useResource(() => getMyApplications(), [])
  const applications = data ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight mb-1">
            My Applications
          </h1>
          <p className="text-sm text-[#64748B]">
            Track the status of every position you have applied to.
          </p>
        </div>
        <Link
          href="/applicant/positions"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors w-full sm:w-auto justify-center"
        >
          <FiBriefcase className="w-4 h-4" />
          Browse Open Positions
        </Link>
      </div>

      {error ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : loading ? (
        <Spinner label="Loading your applications…" />
      ) : applications.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
          <EmptyState
            title="No applications yet"
            description="Start by browsing open positions and applying."
            action={
              <Link
                href="/applicant/positions"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors"
              >
                Browse Positions
                <FiArrowRight className="w-4 h-4" />
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const isDraft = app.status === 'draft'
            // Drafts resume at step 1 so the resume details are reachable before
            // the criteria form, which is a forward link away.
            const href =
              isDraft && app.position
                ? `/applicant/apply/${app.position.id}/upload`
                : `/applicant/my-applications/${app.id}`

            return (
              <Link
                key={app.id}
                href={href}
                className="block bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-6 hover:shadow-md hover:border-[#2563EB] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#1E293B] mb-1">
                      {app.position?.title ?? '—'}
                    </h3>
                    <p className="text-sm text-[#64748B]">{app.position?.department?.name ?? ''}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{app.hiring_round?.name ?? ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.status} size="md" />
                  </div>
                </div>

                {isDraft ? (
                  <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <FiEdit3 className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800">
                      This application is unfinished. Continue where you left off and submit it before
                      the deadline — drafts are never reviewed.
                    </p>
                  </div>
                ) : (
                  <HiringPipeline currentStatus={app.status} />
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-5 pt-4 border-t border-[#E2E8F0]">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1.5">
                      <FiCalendar className="w-3.5 h-3.5" />
                      Applied:{' '}
                      <span className="font-semibold text-[#1E293B]">
                        {formatDate(app.applied_at)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FiCalendar className="w-3.5 h-3.5" />
                      Last update:{' '}
                      <span className="font-semibold text-[#1E293B]">
                        {formatDate(app.status_updated_at ?? app.applied_at)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FiFileText className="w-3.5 h-3.5" />
                      <span className="font-semibold text-[#1E293B]">{app.documents_count}</span>{' '}
                      document{app.documents_count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#2563EB]">
                    {isDraft ? 'Continue Application' : 'View Details'}
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
