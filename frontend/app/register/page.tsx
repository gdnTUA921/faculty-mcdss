'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiArrowRight,
  FiArrowLeft,
  FiCheckCircle,
} from 'react-icons/fi'
import { ErrorBanner } from '@/components/shared/DataState'
import { register } from '@/lib/api/applicant'
import { ApiError, storeSession } from '@/lib/api/client'

export default function RegisterPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordsMatch = !confirmPassword || password === confirmPassword

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const result = await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        password,
        password_confirmation: confirmPassword,
      })

      // Registration issues a usable token, so go straight to the portal.
      storeSession(result.token, result.user)
      // Full reload so AuthProvider picks up the new session before the guard runs.
      window.location.href = '/applicant/dashboard'
    } catch (err) {
      if (err instanceof ApiError) {
        setError(Object.values(err.errors)[0]?.[0] ?? err.message)
      } else {
        setError('Could not reach the server. Is the API running on port 8000?')
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFF] via-white to-[#DBEAFE] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
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
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Create your account</h1>
            <p className="text-blue-100 text-sm">
              Register as an external applicant to start applying for positions.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                id="first-name"
                label="First Name"
                icon={FiUser}
                value={firstName}
                onChange={setFirstName}
                placeholder="Juan"
                required
              />
              <TextField
                id="last-name"
                label="Last Name"
                icon={FiUser}
                value={lastName}
                onChange={setLastName}
                placeholder="dela Cruz"
                required
              />
            </div>

            <TextField
              id="email"
              label="Email Address"
              icon={FiMail}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              hint="We'll send a verification link to this address."
              required
            />

            <TextField
              id="phone"
              label="Phone Number"
              icon={FiPhone}
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="+63 900 000 0000"
              autoComplete="tel"
              hint="Optional."
            />

            <TextField
              id="password"
              label="Password"
              icon={FiLock}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="new-password"
              hint="Minimum 8 characters."
              required
            />

            <TextField
              id="confirm-password"
              label="Confirm Password"
              icon={FiLock}
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="••••••••"
              autoComplete="new-password"
              hint={passwordsMatch ? undefined : 'Passwords do not match'}
              hintError={!passwordsMatch}
              required
            />

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] accent-[#2563EB]"
              />
              <span className="text-xs text-[#64748B]">
                I agree to the{' '}
                <a href="#" className="text-[#2563EB] hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#2563EB] hover:underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !agreed || password.length < 8 || !passwordsMatch}
              className="flex items-center justify-center gap-2 w-full bg-[#2563EB] text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
              <FiCheckCircle className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#1E3A8A]">
                You&apos;ll be signed in right away, and a verification email will be sent to your
                address. During local development it is captured by Mailpit at{' '}
                <a
                  href="http://localhost:8025"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline"
                >
                  localhost:8025
                </a>
                .
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function TextField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  hint,
  hintError,
  required,
}: {
  id: string
  label: string
  icon: typeof FiUser
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  autoComplete?: string
  hint?: string
  hintError?: boolean
  required?: boolean
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5"
      >
        {label}
        {required && <span className="text-[#DC2626] ml-1">*</span>}
      </label>
      <div className="relative">
        <Icon className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
        <input
          id={id}
          type={type}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-3 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
        />
      </div>
      {hint && (
        <p className={`text-xs mt-1.5 ${hintError ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>{hint}</p>
      )}
    </div>
  )
}
