'use client'

import { useState } from 'react'
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiAlertCircle,
  FiSave,
  FiKey,
  FiCheckCircle,
} from 'react-icons/fi'
import { currentUser } from '@/lib/applicantData'

export default function ProfilePage() {
  const [saved, setSaved] = useState(false)

  const initials =
    currentUser.firstName.charAt(0) + currentUser.lastName.charAt(0)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight mb-1">
        My Profile
      </h1>
      <p className="text-sm text-[#64748B] mb-6 sm:mb-8">
        Manage your personal information and account settings.
      </p>

      {/* First-time login banner */}
      {currentUser.isFirstLogin && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 sm:p-5 mb-6 flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-amber-900 text-sm mb-1">First-time login detected</p>
            <p className="text-xs text-amber-800">
              You&apos;re using a temporary password issued by HR. Please update your credentials below to secure your account.
            </p>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-7 mb-6">
        <div className="flex items-center gap-4 sm:gap-5 mb-6 pb-6 border-b border-[#E2E8F0]">
          <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-[#1E3A8A] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl sm:text-2xl">{initials}</span>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1E293B]">{currentUser.fullName}</h2>
            <p className="text-sm text-[#64748B]">{currentUser.email}</p>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
              {currentUser.type === 'external' ? 'External Applicant' : 'Internal Applicant'}
            </span>
          </div>
        </div>

        <h3 className="text-base font-bold text-[#1E293B] mb-4">Personal Information</h3>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
                First Name
              </label>
              <div className="relative">
                <FiUser className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="text"
                  defaultValue={currentUser.firstName}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
                Last Name
              </label>
              <div className="relative">
                <FiUser className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="text"
                  defaultValue={currentUser.lastName}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
              <input
                type="email"
                defaultValue={currentUser.email}
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {currentUser.type === 'internal' && currentUser.institutionEmail && (
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <FiMail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={currentUser.institutionEmail}
                  readOnly
                  className="w-full pl-10 pr-3 py-2.5 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg text-sm text-[#64748B] cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-[#64748B] mt-1.5">Institutional email cannot be changed</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <FiPhone className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
              <input
                type="tel"
                defaultValue={currentUser.phone}
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-end">
            {saved && (
              <p className="text-sm text-[#16A34A] font-semibold flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4" />
                Changes saved
              </p>
            )}
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors"
            >
              <FiSave className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-7">
        <div className="flex items-center gap-2 mb-4">
          <FiKey className="w-5 h-5 text-[#2563EB]" />
          <h3 className="text-base font-bold text-[#1E293B]">Change Password</h3>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <FiLock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
                New Password
              </label>
              <div className="relative">
                <FiLock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[#2563EB] text-[#2563EB] rounded-lg text-sm font-semibold hover:bg-[#DBEAFE] transition-colors"
            >
              <FiKey className="w-4 h-4" />
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
