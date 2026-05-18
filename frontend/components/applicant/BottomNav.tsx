'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FiHome,
  FiBriefcase,
  FiClipboard,
  FiFileText,
  FiBell,
  FiUser,
} from 'react-icons/fi'

const tabs = [
  { label: 'Home', href: '/applicant/dashboard', icon: FiHome },
  { label: 'Positions', href: '/applicant/positions', icon: FiBriefcase },
  { label: 'Apps', href: '/applicant/my-applications', icon: FiClipboard },
  { label: 'Docs', href: '/applicant/documents', icon: FiFileText },
  { label: 'Alerts', href: '/applicant/notifications', icon: FiBell },
  { label: 'Profile', href: '/applicant/profile', icon: FiUser },
]

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-30">
      <div className="grid grid-cols-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                active
                  ? 'flex flex-col items-center gap-0.5 py-2.5 text-[#2563EB]'
                  : 'flex flex-col items-center gap-0.5 py-2.5 text-[#64748B] hover:text-[#1E293B]'
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
