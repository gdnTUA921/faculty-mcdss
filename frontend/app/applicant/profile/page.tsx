'use client'

import { useEffect, useState } from 'react'
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiSave,
  FiKey,
  FiInfo,
} from 'react-icons/fi'
import { ErrorBanner, ErrorState, Spinner, SuccessBanner } from '@/components/shared/DataState'
import { ApiError } from '@/lib/api/client'
import { changePassword, getMyProfile, updateMyProfile } from '@/lib/api/applicant'
import { useAuth } from '@/lib/auth'
import { initials } from '@/lib/format'
import { useResource } from '@/lib/useResource'

export default function ProfilePage() {
  const { user } = useAuth()

  const { data: profile, loading, error, reload } = useResource(() => getMyProfile(), [])

  const [institutionEmail, setInstitutionEmail] = useState('')
  const [summary, setSummary] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileNotice, setProfileNotice] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Seed the editable fields once the profile arrives.
  useEffect(() => {
    if (!profile) return
    setInstitutionEmail(profile.institution_email ?? '')
    setSummary(profile.summary ?? '')
  }, [profile])

  const isInternal = profile?.applicant_type === 'internal'

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault()
    setSavingProfile(true)
    setProfileError(null)
    setProfileNotice(null)

    try {
      await updateMyProfile({
        institution_email: institutionEmail.trim() || null,
        summary: summary.trim() || null,
      })
      setProfileNotice('Profile saved.')
      reload()
    } catch (err) {
      setProfileError(
        err instanceof ApiError
          ? (Object.values(err.errors)[0]?.[0] ?? err.message)
          : 'Could not save your profile.',
      )
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault()
    setSavingPassword(true)
    setPasswordError(null)
    setPasswordNotice(null)

    try {
      await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })
      setPasswordNotice('Password updated. Other devices have been signed out.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(
        err instanceof ApiError
          ? (Object.values(err.errors)[0]?.[0] ?? err.message)
          : 'Could not update your password.',
      )
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) return <Spinner label="Loading your profile…" />

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight mb-1">My Profile</h1>
      <p className="text-sm text-[#64748B] mb-6 sm:mb-8">
        Manage your personal information and account settings.
      </p>

      {error && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm mb-6">
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-7 mb-6">
        <div className="flex items-center gap-4 sm:gap-5 mb-6 pb-6 border-b border-[#E2E8F0]">
          <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-[#1E3A8A] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl sm:text-2xl">
              {initials(user?.first_name, user?.last_name)}
            </span>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1E293B]">
              {user ? `${user.first_name} ${user.last_name}` : '—'}
            </h2>
            <p className="text-sm text-[#64748B]">{user?.email ?? '—'}</p>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
              {isInternal ? 'Internal Applicant' : 'External Applicant'}
            </span>
          </div>
        </div>

        <h3 className="text-base font-bold text-[#1E293B] mb-4">Personal Information</h3>

        {profileNotice && (
          <SuccessBanner message={profileNotice} onDismiss={() => setProfileNotice(null)} />
        )}
        {profileError && <ErrorBanner message={profileError} onDismiss={() => setProfileError(null)} />}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField label="First Name" value={user?.first_name} icon={FiUser} />
            <ReadOnlyField label="Last Name" value={user?.last_name} icon={FiUser} />
          </div>

          <ReadOnlyField label="Email Address" value={user?.email} icon={FiMail} />
          <ReadOnlyField label="Phone Number" value={profile?.phone ?? '—'} icon={FiPhone} />

          <div className="flex items-start gap-2.5 px-4 py-3 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg">
            <FiInfo className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#64748B]">
              Your name, email and phone are managed by HR and cannot be edited here. Contact the HR
              office if any of them need to change.
            </p>
          </div>

          <div>
            <label
              htmlFor="inst-email"
              className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5"
            >
              Institutional Email
            </label>
            <div className="relative">
              <FiMail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
              <input
                id="inst-email"
                type="email"
                value={institutionEmail}
                onChange={(e) => setInstitutionEmail(e.target.value)}
                placeholder={isInternal ? 'name@university.edu.ph' : 'Optional'}
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="summary"
              className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5"
            >
              Professional Summary
            </label>
            <textarea
              id="summary"
              rows={4}
              maxLength={5000}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A short summary of your background, expertise and teaching interests…"
              className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-y"
            />
            <p className="text-xs text-[#94A3B8] mt-1">{summary.length} / 5000 characters</p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-60"
            >
              <FiSave className="w-4 h-4" />
              {savingProfile ? 'Saving…' : 'Save Changes'}
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

        {passwordNotice && (
          <SuccessBanner message={passwordNotice} onDismiss={() => setPasswordNotice(null)} />
        )}
        {passwordError && (
          <ErrorBanner message={passwordError} onDismiss={() => setPasswordError(null)} />
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <PasswordField
            id="current-password"
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordField
              id="new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              hint="At least 8 characters"
            />
            <PasswordField
              id="confirm-password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              hint={
                confirmPassword && confirmPassword !== newPassword ? 'Passwords do not match' : undefined
              }
              hintError={Boolean(confirmPassword) && confirmPassword !== newPassword}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={
                savingPassword ||
                !currentPassword ||
                newPassword.length < 8 ||
                newPassword !== confirmPassword
              }
              className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[#2563EB] text-[#2563EB] rounded-lg text-sm font-semibold hover:bg-[#DBEAFE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiKey className="w-4 h-4" />
              {savingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ReadOnlyField({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value?: string | null
  icon: typeof FiUser
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
        <input
          type="text"
          value={value || '—'}
          readOnly
          className="w-full pl-10 pr-3 py-2.5 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg text-sm text-[#64748B] cursor-not-allowed"
        />
      </div>
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
  hintError,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  hint?: string
  hintError?: boolean
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <FiLock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
        <input
          id={id}
          type="password"
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        />
      </div>
      {hint && (
        <p className={`text-xs mt-1 ${hintError ? 'text-[#DC2626]' : 'text-[#94A3B8]'}`}>{hint}</p>
      )}
    </div>
  )
}
