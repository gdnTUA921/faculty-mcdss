'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FiHome,
  FiBriefcase,
  FiClipboard,
  FiFileText,
  FiBell,
  FiLogOut,
} from 'react-icons/fi'

const navItems = [
  { label: 'Dashboard', href: '/applicant/dashboard', icon: FiHome },
  { label: 'Open Positions', href: '/applicant/positions', icon: FiBriefcase },
  { label: 'My Applications', href: '/applicant/my-applications', icon: FiClipboard },
  { label: 'My Documents', href: '/applicant/documents', icon: FiFileText },
  { label: 'Notifications', href: '/applicant/notifications', icon: FiBell },
]

export default function TopNav() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/applicant/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <span className="text-white font-bold text-sm">MC</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-[#1E293B] font-bold text-base leading-tight">MCDSS</p>
              <p className="text-[#64748B] text-[10px] leading-tight">Applicant Portal</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? 'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-[#2563EB] bg-[#DBEAFE]'
                      : 'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFF]'
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Profile & Logout */}
          <div className="flex items-center gap-2">
            <Link
              href="/applicant/profile"
              className={
                pathname.startsWith('/applicant/profile')
                  ? 'flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md bg-[#DBEAFE]'
                  : 'flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md hover:bg-[#F8FAFF]'
              }
            >
              <div className="w-8 h-8 rounded-full bg-[#1E3A8A] flex items-center justify-center">
                <span className="text-white text-xs font-bold">JD</span>
              </div>
              <span className="hidden sm:inline text-sm font-medium text-[#1E293B]">Juan dela Cruz</span>
            </Link>
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#DC2626] rounded-md"
            >
              <FiLogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Sign Out</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
