'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  FiHome,
  FiBriefcase,
  FiUsers,
  FiCalendar,
  FiSliders,
  FiArchive,
  FiUserPlus,
  FiBell,
  FiLogOut,
  FiMenu,
} from 'react-icons/fi'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: FiHome, exact: true },
  { label: 'Positions', href: '/admin/positions', icon: FiBriefcase },
  { label: 'Applicants', href: '/admin/applicants', icon: FiUsers },
  { label: 'Hiring Rounds', href: '/admin/hiring-rounds', icon: FiCalendar },
  { label: 'Assignment', href: '/admin/assignment', icon: FiSliders },
  { label: 'Applicant Pool', href: '/admin/applicant-pool', icon: FiArchive },
  { label: 'Staff Accounts', href: '/admin/staff-accounts', icon: FiUserPlus },
  { label: 'Notifications', href: '/admin/notifications', icon: FiBell },
]

const TRANSITION = 'transition-all duration-300 ease-in-out'

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={`${isOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-[#1E3A8A] flex flex-col h-full overflow-hidden ${TRANSITION}`}
    >
      {/* Header */}
      <div
        className={`h-[72px] flex-shrink-0 border-b border-blue-700 flex items-center px-3 ${TRANSITION} ${
          isOpen ? 'gap-2' : 'gap-0 justify-center'
        }`}
      >
        <Link
          href="/admin"
          aria-label="MCDSS Home"
          className={`flex items-center gap-3 overflow-hidden flex-1 ${TRANSITION} ${
            isOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">MC</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-base leading-tight whitespace-nowrap">MCDSS</p>
            <p className="text-blue-300 text-xs leading-tight whitespace-nowrap">Faculty HR System</p>
          </div>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
        >
          <FiMenu className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!isOpen ? item.label : undefined}
              className={`flex items-center rounded-lg text-sm font-medium transition-colors overflow-hidden ${
                isOpen ? 'gap-3 px-3 py-2.5' : 'gap-0 px-0 py-2.5 justify-center'
              } ${
                active
                  ? 'bg-[#2563EB] text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span
                className={`whitespace-nowrap ${TRANSITION} ${
                  isOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="px-3 py-4 border-t border-blue-700 flex-shrink-0 overflow-hidden">
        <div
          className={`flex items-center mb-3 overflow-hidden ${TRANSITION} ${
            isOpen ? 'gap-3' : 'gap-0 justify-center'
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">AU</span>
          </div>
          <div
            className={`min-w-0 overflow-hidden ${TRANSITION} ${
              isOpen ? 'opacity-100 max-w-full flex-1' : 'opacity-0 max-w-0 flex-none'
            }`}
          >
            <p className="text-white text-sm font-medium whitespace-nowrap">Admin User</p>
            <p className="text-blue-300 text-xs whitespace-nowrap">HR Personnel</p>
          </div>
        </div>
        <Link
          href="/"
          title={!isOpen ? 'Sign Out' : undefined}
          className={`flex items-center text-blue-300 hover:text-white text-xs transition-colors py-1.5 rounded-md hover:bg-blue-800 overflow-hidden ${
            isOpen ? 'gap-3 px-2' : 'gap-0 px-0 justify-center'
          }`}
        >
          <FiLogOut className="w-3.5 h-3.5 flex-shrink-0" />
          <span
            className={`whitespace-nowrap ${TRANSITION} ${
              isOpen ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0'
            }`}
          >
            Sign Out
          </span>
        </Link>
      </div>
    </aside>
  )
}
