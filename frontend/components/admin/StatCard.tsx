import { IconType } from 'react-icons'

interface StatCardProps {
  icon: IconType
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  iconBg?: string
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeType = 'neutral',
  iconBg = 'bg-blue-100',
}: StatCardProps) {
  const changeColor =
    changeType === 'positive'
      ? 'text-green-600'
      : changeType === 'negative'
      ? 'text-red-600'
      : 'text-[#64748B]'

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[#64748B] mb-1">{label}</p>
          <p className="text-2xl font-bold text-[#1E293B]">{value}</p>
          {change && (
            <p className={`text-xs mt-1 font-medium ${changeColor}`}>{change}</p>
          )}
        </div>
        <div className={`${iconBg} p-2.5 rounded-lg flex-shrink-0`}>
          <Icon className="w-5 h-5 text-[#2563EB]" />
        </div>
      </div>
    </div>
  )
}
