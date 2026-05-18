'use client'

import Link from 'next/link'
import {
  FiUser,
  FiMail,
  FiLock,
  FiArrowRight,
  FiArrowLeft,
  FiCheckCircle,
} from 'react-icons/fi'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFF] via-white to-[#DBEAFE] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] mb-6"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-[#E2E8F0] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] p-6 sm:p-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                <span className="text-white font-bold text-sm">MC</span>
              </div>
              <span className="text-blue-200 text-xs">MCDSS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
              Create your account
            </h1>
            <p className="text-blue-100 text-sm">
              Register as an external applicant to start applying for positions.
            </p>
          </div>

          {/* Form */}
          <form className="p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <FiUser className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Juan"
                    className="w-full pl-10 pr-3 py-3 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
                  Last Name
                </label>
                <div className="relative">
                  <FiUser className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="dela Cruz"
                    className="w-full pl-10 pr-3 py-3 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-3 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              </div>
              <p className="text-xs text-[#64748B] mt-1.5">We&apos;ll send a verification link to this address.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <FiLock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-3 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              </div>
              <p className="text-xs text-[#64748B] mt-1.5">Minimum 8 characters with at least one number.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-3 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]" />
              <span className="text-xs text-[#64748B]">
                I agree to the <a href="#" className="text-[#2563EB] hover:underline">Terms of Service</a> and{' '}
                <a href="#" className="text-[#2563EB] hover:underline">Privacy Policy</a>.
              </span>
            </label>

            <Link
              href="/applicant/dashboard"
              className="flex items-center justify-center gap-2 w-full bg-[#2563EB] text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors"
            >
              Create Account
              <FiArrowRight className="w-4 h-4" />
            </Link>

            {/* Info banner */}
            <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
              <FiCheckCircle className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#1E3A8A]">
                After registering, you&apos;ll receive a verification email. Please verify your address before applying.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
