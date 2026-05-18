'use client'

import { useState } from 'react'
import {
  FiUserPlus,
  FiMail,
  FiInfo,
  FiCheck,
} from 'react-icons/fi'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { staffAccounts } from '@/lib/adminData'

function formatDateTime(ts: string) {
  return new Date(ts).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function StaffAccountsPage() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmittedName(`${firstName} ${lastName}`)
    setSubmitted(true)
    setEmail('')
    setFirstName('')
    setLastName('')

    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Internal Staff Accounts"
        subtitle="Create and manage internal faculty/staff MCDSS accounts"
      />

      {/* Create Account Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <FiUserPlus className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1E293B]">Create Staff Account</h2>
            <p className="text-xs text-[#64748B]">Internal faculty and staff members only</p>
          </div>
        </div>

        {/* Success Toast */}
        {submitted && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">
              Account created for <strong>{submittedName}</strong>. Welcome email with temporary credentials has been sent.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-[#1E293B] mb-1">
                Institutional Email <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., juan.dela.cruz@university.edu.ph"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1E293B] mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1E293B] mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#2563EB] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <FiUserPlus className="w-4 h-4" />
              Create Account
            </button>
            <div className="flex items-start gap-2 text-xs text-[#64748B] pt-2.5">
              <FiInfo className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Staff will receive a welcome email with temporary credentials. They must change their password on first login.</span>
            </div>
          </div>
        </form>
      </div>

      {/* Existing Accounts Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-semibold text-[#1E293B]">
            Existing Staff Accounts
            <span className="ml-2 text-sm font-normal text-[#64748B]">({staffAccounts.length} total)</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Account Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Password</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Created At</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffAccounts.map((staff, idx) => (
                <tr
                  key={staff.id}
                  className={idx % 2 === 0 ? 'bg-white border-b border-[#F1F5F9]' : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#2563EB] text-xs font-bold">
                          {staff.firstName[0]}{staff.lastName[0]}
                        </span>
                      </div>
                      <span className="font-semibold text-[#1E293B]">{staff.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[#64748B] text-xs">{staff.email}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={staff.accountStatus} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={staff.hasTempPassword ? 'temp_yes' : 'temp_no'} />
                  </td>
                  <td className="px-4 py-3.5 text-[#64748B] text-xs">{formatDateTime(staff.createdAt)}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex justify-end">
                      <button className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-200">
                        <FiMail className="w-3.5 h-3.5" />
                        Resend Email
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
