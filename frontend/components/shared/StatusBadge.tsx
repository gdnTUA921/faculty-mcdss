interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

type BadgeStyle = {
  bg: string
  text: string
  label: string
}

const statusMap: Record<string, BadgeStyle> = {
  // Position statuses
  open: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Closed' },
  filled: { bg: 'bg-green-100', text: 'text-green-700', label: 'Filled' },

  // Applicant statuses
  applied: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Applied' },
  for_interview: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'For Interview' },
  for_review: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'For Review' },
  hired: { bg: 'bg-green-100', text: 'text-green-700', label: 'Hired' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  withdrawn: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Withdrawn' },

  // Account / general statuses
  active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Inactive' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },

  // Round statuses
  running: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Running' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
  archived: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Archived' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },

  // Target applicant type
  external: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'External' },
  internal: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Internal' },
  both: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Both' },

  // Data types
  numeric: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Numeric' },
  boolean: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Boolean' },
  select: { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Select' },
  text: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Text' },

  // Notification
  sent: { bg: 'bg-green-100', text: 'text-green-700', label: 'Sent' },
  email: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Email' },
  in_app: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'In-App' },

  // Document
  verified: { bg: 'bg-green-100', text: 'text-green-700', label: 'Verified' },
  unverified: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Unverified' },

  // Assigned
  yes: { bg: 'bg-green-100', text: 'text-green-700', label: 'Assigned' },
  no: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Not Assigned' },

  // Pool status
  pool_active: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Active' },
  reengaged: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Re-engaged' },
  pool_inactive: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Inactive' },

  // Temp password
  temp_yes: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Temporary' },
  temp_no: { bg: 'bg-green-100', text: 'text-green-700', label: 'Set' },

  // Notification type
  application_received: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Application Received' },
  status_change: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Status Change' },
  pool_invitation: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Pool Invitation' },
  account_created: { bg: 'bg-green-100', text: 'text-green-700', label: 'Account Created' },
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const style = statusMap[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: status }

  const sizeClass = size === 'md'
    ? 'px-3 py-1 text-sm font-medium'
    : 'px-2.5 py-0.5 text-xs font-semibold'

  return (
    <span className={`inline-flex items-center rounded-full ${style.bg} ${style.text} ${sizeClass} whitespace-nowrap`}>
      {style.label}
    </span>
  )
}
