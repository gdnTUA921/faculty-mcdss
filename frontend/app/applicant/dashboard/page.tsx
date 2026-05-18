import Link from 'next/link'
import {
  FiBriefcase,
  FiClipboard,
  FiBell,
  FiArrowRight,
  FiCalendar,
} from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import HiringPipeline from '@/components/applicant/HiringPipeline'
import {
  currentUser,
  myApplications,
  myNotifications,
  openPositions,
  notificationTypeLabel,
} from '@/lib/applicantData'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelative(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ApplicantDashboardPage() {
  const unreadCount = myNotifications.filter((n) => !n.read).length
  const recentUnread = myNotifications.filter((n) => !n.read).slice(0, 3)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Welcome */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">
          Welcome back, {currentUser.firstName}!
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Here&apos;s an overview of your applications and recent activity.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
        <DashboardStat
          icon={FiClipboard}
          label="My Applications"
          value={myApplications.length}
          accent="bg-blue-100 text-[#1E3A8A]"
        />
        <DashboardStat
          icon={FiBriefcase}
          label="Open Positions"
          value={openPositions.length}
          accent="bg-indigo-100 text-indigo-700"
        />
        <DashboardStat
          icon={FiBell}
          label="Unread Alerts"
          value={unreadCount}
          accent="bg-amber-100 text-amber-700"
        />
        <DashboardStat
          icon={FiCalendar}
          label="Active Round"
          value="AY 25-26"
          accent="bg-green-100 text-green-700"
          isText
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Applications */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1E293B]">My Applications</h2>
            <Link href="/applicant/my-applications" className="text-sm text-[#2563EB] hover:underline font-medium flex items-center gap-1">
              View all <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {myApplications.map((app) => (
              <Link
                key={app.id}
                href={`/applicant/my-applications/${app.id}`}
                className="block bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 hover:border-[#2563EB] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-[#1E293B] mb-0.5">{app.positionTitle}</h3>
                    <p className="text-xs text-[#64748B]">{app.department}</p>
                    <p className="text-xs text-[#64748B]">{app.hiringRound}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                <HiringPipeline currentStatus={app.status} />

                <p className="text-xs text-[#64748B] mt-4 flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5" />
                  Last updated: {formatRelative(app.lastUpdated)}
                </p>
              </Link>
            ))}
          </div>

          {/* Browse positions CTA */}
          <Link
            href="/applicant/positions"
            className="mt-5 flex items-center justify-between bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white rounded-xl p-5 hover:shadow-lg transition-all"
          >
            <div>
              <p className="font-bold text-base mb-0.5">Looking for more opportunities?</p>
              <p className="text-blue-100 text-sm">Browse {openPositions.length} open positions across departments</p>
            </div>
            <FiArrowRight className="w-5 h-5 flex-shrink-0" />
          </Link>
        </div>

        {/* Notifications panel */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1E293B]">Notifications</h2>
            <Link href="/applicant/notifications" className="text-sm text-[#2563EB] hover:underline font-medium flex items-center gap-1">
              View all <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm divide-y divide-[#E2E8F0]">
            {recentUnread.length === 0 ? (
              <div className="p-6 text-center">
                <FiBell className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-sm text-[#64748B]">No unread notifications</p>
              </div>
            ) : (
              recentUnread.map((notif) => (
                <Link
                  key={notif.id}
                  href="/applicant/notifications"
                  className="block p-4 hover:bg-[#F8FAFF] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#2563EB] mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-wide mb-1">
                        {notificationTypeLabel[notif.type] || 'Notification'}
                      </p>
                      <p className="text-sm font-semibold text-[#1E293B] mb-1 line-clamp-2">{notif.subject}</p>
                      <p className="text-xs text-[#64748B] line-clamp-2">{notif.bodyPreview}</p>
                      <p className="text-xs text-[#94A3B8] mt-1.5">{formatRelative(notif.sentAt)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardStat({
  icon: Icon,
  label,
  value,
  accent,
  isText = false,
}: {
  icon: typeof FiBriefcase
  label: string
  value: number | string
  accent: string
  isText?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 sm:p-5">
      <div className={`w-9 h-9 rounded-lg ${accent} flex items-center justify-center mb-3`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1">{label}</p>
      <p className={isText ? 'text-base sm:text-lg font-bold text-[#1E293B]' : 'text-xl sm:text-2xl font-bold text-[#1E293B]'}>
        {value}
      </p>
    </div>
  )
}
