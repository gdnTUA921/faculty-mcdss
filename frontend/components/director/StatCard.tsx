import type { IconType } from 'react-icons'

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
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-[#1E3A8A]" />
        </div>
      </div>
      <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#1E293B] mb-1">{value}</p>
      {change && <p className={`text-xs ${changeColor}`}>{change}</p>}
    </div>
  )
}
