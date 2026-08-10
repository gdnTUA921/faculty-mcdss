'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FiMail,
  FiLock,
  FiArrowRight,
  FiUsers,
  FiShield,
  FiZap,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi'
import { ApiError } from '@/lib/api/client'
import { FullPageSpinner, HOME_FOR_ROLE, useAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in — skip the form and go straight to the right dashboard.
  useEffect(() => {
    if (!loading && user) router.replace(HOME_FOR_ROLE[user.role])
  }, [user, loading, router])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const signedIn = await login(email.trim(), password)
      router.replace(HOME_FOR_ROLE[signedIn.role])
    } catch (err) {
      if (err instanceof ApiError) {
        // 422 puts the reason under errors.email; 403 means a deactivated account.
        setError(err.fieldError('email') ?? err.message)
      } else {
        setError('Could not reach the server. Is the API running on port 8000?')
      }
      setSubmitting(false)
    }
  }

  if (loading || user) return <FullPageSpinner />

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
              Your dashboard is selected automatically based on your role.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 mb-5 bg-red-50 border border-red-200 rounded-lg">
              <FiAlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <FiMail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu.ph"
                  className="w-full pl-10 pr-3 py-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <FiLock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#64748B] hover:text-[#1E293B]"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 w-full bg-[#2563EB] text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

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
