'use client'

import { useState } from 'react'
import { FiUserPlus, FiMail, FiInfo, FiSearch, FiSlash, FiCheckCircle } from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { EmptyState, ErrorBanner, ErrorState, SuccessBanner, TableSkeleton } from '@/components/shared/DataState'
import { ApiError } from '@/lib/api/client'
import { createStaffAccount, getStaffAccounts, resendStaffInvite, setStaffActive } from '@/lib/api/admin'
import { useAuth } from '@/lib/auth'
import { formatDateTime, humanize } from '@/lib/format'
import { useResource } from '@/lib/useResource'
import type { StaffAccount } from '@/lib/types'

export default function StaffAccountsPage() {
  const { user } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('internal_applicant')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: accounts, loading, error, reload } = useResource(
    () =>
      getStaffAccounts({
        search: searchTerm || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
      }),
    [searchTerm, roleFilter],
  )

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      await createStaffAccount({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        role,
        phone: phone.trim() || null,
      })
      setNotice(
        `Account created for ${firstName.trim()} ${lastName.trim()}. A welcome email with a temporary password has been sent.`,
      )
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      reload()
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(Object.values(err.errors)[0]?.[0] ?? err.message)
      } else {
        setFormError('Could not create the account.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend(account: StaffAccount) {
    setActionError(null)
    setBusyId(account.id)
    try {
      await resendStaffInvite(account.id)
      setNotice(`A new temporary password has been emailed to ${account.email}.`)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not resend the invite.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleToggleActive(account: StaffAccount) {
    setActionError(null)
    setBusyId(account.id)
    try {
      await setStaffActive(account.id, !account.is_active)
      setNotice(`${account.full_name} ${account.is_active ? 'deactivated' : 'activated'}.`)
      reload()
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : 'Could not change the account status.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const rows = accounts ?? []

  return (
    <div className="p-8">
      <PageHeader
        title="Staff Accounts"
        subtitle="Create and manage admin, director and internal faculty accounts"
      />

      {notice && <SuccessBanner message={notice} onDismiss={() => setNotice(null)} />}
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}

      {/* Create Account Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <FiUserPlus className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1E293B]">Create Staff Account</h2>
            <p className="text-xs text-[#64748B]">
              A temporary password is generated and emailed automatically
            </p>
          </div>
        </div>

        {formError && <ErrorBanner message={formError} onDismiss={() => setFormError(null)} />}

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label htmlFor="fn" className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="fn"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="ln" className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="ln"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="em" className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="em"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.edu.ph"
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="rl" className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="rl"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white"
            >
              <option value="internal_applicant">Internal Faculty</option>
              <option value="director">Academic Director</option>
              <option value="admin">Admin / HR</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 h-[38px]"
          >
            <FiUserPlus className="w-4 h-4" />
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </form>

        <div className="flex items-start gap-2.5 mt-4 px-4 py-3 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg">
          <FiInfo className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#64748B]">
            Internal faculty accounts also get an applicant profile so they can apply for internal
            positions. Check Mailpit at{' '}
            <a
              href="http://localhost:8025"
              target="_blank"
              rel="noreferrer"
              className="text-[#2563EB] hover:underline font-medium"
            >
              localhost:8025
            </a>{' '}
            for the temporary password during local development.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-center shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSearchTerm(search.trim())
          }}
          className="relative"
        >
          <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-[#64748B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-56 pl-9 pr-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </form>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin / HR</option>
            <option value="director">Director</option>
            <option value="internal_applicant">Internal Faculty</option>
          </select>
        </div>
        <span className="ml-auto text-sm text-[#64748B]">
          {rows.length} account{rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Accounts table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Password</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Created</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                {loading ? (
                  <TableSkeleton rows={5} cols={7} />
                ) : (
                  <tbody>
                    {rows.map((account, idx) => {
                      const isSelf = account.id === user?.id
                      return (
                        <tr
                          key={account.id}
                          className={
                            idx % 2 === 0
                              ? 'bg-white border-b border-[#F1F5F9]'
                              : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'
                          }
                        >
                          <td className="px-6 py-3.5 font-semibold text-[#1E293B]">
                            {account.full_name}
                            {isSelf && (
                              <span className="ml-2 text-xs font-medium text-[#2563EB]">(you)</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-[#64748B] text-xs">{account.email}</td>
                          <td className="px-4 py-3.5 text-[#64748B] text-xs font-semibold">
                            {humanize(account.role)}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={account.account_status} />
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={account.has_temp_password ? 'temp_yes' : 'temp_no'} />
                          </td>
                          <td className="px-4 py-3.5 text-[#64748B] text-xs">
                            {formatDateTime(account.created_at)}
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleResend(account)}
                                disabled={busyId === account.id}
                                title="Issue a new temporary password and email it"
                                className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-200 disabled:opacity-40"
                              >
                                <FiMail className="w-3.5 h-3.5" />
                                Resend Email
                              </button>
                              <button
                                onClick={() => handleToggleActive(account)}
                                disabled={busyId === account.id || isSelf}
                                title={
                                  isSelf
                                    ? 'You cannot change your own account status'
                                    : account.is_active
                                      ? 'Deactivate this account'
                                      : 'Reactivate this account'
                                }
                                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border disabled:opacity-40 disabled:cursor-not-allowed ${
                                  account.is_active
                                    ? 'text-[#DC2626] hover:bg-red-50 border-red-200'
                                    : 'text-[#16A34A] hover:bg-green-50 border-green-200'
                                }`}
                              >
                                {account.is_active ? (
                                  <>
                                    <FiSlash className="w-3.5 h-3.5" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <FiCheckCircle className="w-3.5 h-3.5" />
                                    Activate
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                )}
              </table>
            </div>
            {!loading && rows.length === 0 && (
              <EmptyState
                title="No staff accounts match this filter"
                description="Self-registered applicants are not shown here."
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
