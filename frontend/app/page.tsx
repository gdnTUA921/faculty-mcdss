'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  FiMail,
  FiLock,
  FiArrowRight,
  FiUsers,
  FiShield,
  FiZap,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiUser,
  FiBookOpen,
} from 'react-icons/fi'

type Role = 'admin' | 'director' | 'applicant'

const demoAccounts: Record<Role, { email: string; password: string; redirect: string; label: string; sub: string }> = {
  admin: {
    email: 'admin@university.edu.ph',
    password: 'demo1234',
    redirect: '/admin',
    label: 'Admin User',
    sub: 'HR Personnel',
  },
  director: {
    email: 'maria.reyes@university.edu.ph',
    password: 'demo1234',
    redirect: '/director',
    label: 'Prof. Maria Reyes',
    sub: 'Academic Director — DIT',
  },
  applicant: {
    email: 'juan.delacruz@email.com',
    password: 'demo1234',
    redirect: '/applicant/dashboard',
    label: 'Juan dela Cruz',
    sub: 'External Applicant',
  },
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<Role>('applicant')

  const account = demoAccounts[role]

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel — Branding */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#2563EB] text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold">MC</span>
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">MCDSS</p>
              <p className="text-blue-200 text-xs">Faculty HR System</p>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Faculty Multi-Criteria Decision Support System
          </h1>
          <p className="text-blue-100 text-base mb-12 leading-relaxed max-w-md">
            A transparent, data-driven platform for faculty hiring and teaching load allocation.
          </p>
        </div>

        <div className="relative z-10 space-y-4 max-w-md hidden md:block">
          <FeatureBullet
            icon={FiUsers}
            title="Configurable Criteria & Weights"
            desc="Per-position evaluation with Weighted Sum Model scoring."
          />
          <FeatureBullet
            icon={FiShield}
            title="Transparent Decisions"
            desc="Full score breakdowns and immutable audit trails."
          />
          <FeatureBullet
            icon={FiZap}
            title="ILP-based Assignment"
            desc="Optimal candidate selection and faculty load allocation."
          />
        </div>

        <div className="relative z-10 text-blue-200 text-xs mt-12 hidden md:block">
          © 2025 MCDSS Faculty HR System. All rights reserved.
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="md:w-1/2 bg-white flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#1E293B] tracking-tight mb-2">
              Sign in to your account
            </h2>
            <p className="text-sm text-[#64748B]">
              Choose a role below to preview the corresponding interface.
            </p>
          </div>

          {/* Role Selector — Demo */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">
              Demo Role
            </p>
            <div className="grid grid-cols-3 gap-2">
              <RoleCard
                active={role === 'admin'}
                onClick={() => setRole('admin')}
                icon={FiShield}
                label="Admin / HR"
              />
              <RoleCard
                active={role === 'director'}
                onClick={() => setRole('director')}
                icon={FiBookOpen}
                label="Director"
              />
              <RoleCard
                active={role === 'applicant'}
                onClick={() => setRole('applicant')}
                icon={FiUser}
                label="Applicant"
              />
            </div>
            <div className="mt-2 px-3 py-2 bg-[#F8FAFF] border border-[#E2E8F0] rounded-md">
              <p className="text-xs text-[#64748B]">
                Signing in as: <span className="font-semibold text-[#1E293B]">{account.label}</span>
                <span className="text-[#94A3B8]"> · {account.sub}</span>
              </p>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                <input
                  key={`email-${role}`}
                  type="email"
                  defaultValue={account.email}
                  className="w-full pl-10 pr-3 py-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide">
                  Password
                </label>
                <a href="#" className="text-xs text-[#2563EB] hover:underline font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <FiLock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                <input
                  key={`pw-${role}`}
                  type={showPassword ? 'text' : 'password'}
                  defaultValue={account.password}
                  className="w-full pl-10 pr-10 py-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#64748B] hover:text-[#1E293B]"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Link
              href={account.redirect}
              className="flex items-center justify-center gap-2 w-full bg-[#2563EB] text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors"
            >
              Sign In as {role === 'admin' ? 'Admin' : role === 'director' ? 'Director' : 'Applicant'}
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </form>

          {role === 'applicant' && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-[#E2E8F0]" />
                <p className="text-xs text-[#64748B] uppercase tracking-wide">Or</p>
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>

              <div className="text-center">
                <p className="text-sm text-[#64748B] mb-3">Don&apos;t have an account?</p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#2563EB] text-[#2563EB] rounded-lg text-sm font-semibold hover:bg-[#DBEAFE] transition-colors"
                >
                  Register as External Applicant
                </Link>
              </div>
            </>
          )}

          <div className="mt-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
            <FiCheckCircle className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#1E3A8A]">
              <span className="font-semibold">Frontend demo mode:</span> No real authentication. Switch roles above to preview the three interfaces.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureBullet({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof FiUsers
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-blue-200 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function RoleCard({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof FiUser
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border-2 border-[#2563EB] bg-[#DBEAFE] text-[#1E3A8A] transition-all'
          : 'flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border-2 border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#94A3B8] hover:text-[#1E293B] transition-all'
      }
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  )
}
