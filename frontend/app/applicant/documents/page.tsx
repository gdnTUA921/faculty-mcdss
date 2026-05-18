'use client'

import { useState } from 'react'
import {
  FiUpload,
  FiFileText,
  FiDownload,
  FiTrash2,
  FiX,
  FiUploadCloud,
  FiCalendar,
} from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import { myDocuments } from '@/lib/applicantData'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DocumentsPage() {
  const [showUpload, setShowUpload] = useState(false)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight mb-1">
            My Documents
          </h1>
          <p className="text-sm text-[#64748B]">
            All your uploaded credentials. Reused across applications.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors w-full sm:w-auto justify-center"
        >
          <FiUpload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <SummaryCard label="Total" value={myDocuments.length} color="bg-blue-100 text-[#1E3A8A]" />
        <SummaryCard
          label="Verified"
          value={myDocuments.filter((d) => d.verified === 'verified').length}
          color="bg-green-100 text-green-700"
        />
        <SummaryCard
          label="Unverified"
          value={myDocuments.filter((d) => d.verified === 'unverified').length}
          color="bg-amber-100 text-amber-700"
        />
      </div>

      {/* Document Cards (mobile) / Table (desktop) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        {/* Table for desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Document</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">File</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Uploaded</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myDocuments.map((doc, idx) => (
                <tr key={doc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                        <FiFileText className="w-4 h-4 text-[#2563EB]" />
                      </div>
                      <p className="font-semibold text-[#1E293B]">{doc.documentType}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="text-[#1E293B] font-mono">{doc.fileName}</p>
                    <p className="text-[#64748B]">{doc.fileSize}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">{formatDate(doc.uploadedAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.verified} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-md text-[#2563EB] hover:bg-[#DBEAFE]">
                        <FiDownload className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-md text-[#DC2626] hover:bg-red-50">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards for mobile */}
        <ul className="sm:hidden divide-y divide-[#E2E8F0]">
          {myDocuments.map((doc) => (
            <li key={doc.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                    <FiFileText className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1E293B] text-sm truncate">{doc.documentType}</p>
                    <p className="text-xs text-[#64748B] truncate font-mono">{doc.fileName}</p>
                    <p className="text-xs text-[#64748B]">{doc.fileSize}</p>
                  </div>
                </div>
                <StatusBadge status={doc.verified} />
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E2E8F0]">
                <p className="text-xs text-[#64748B] flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  {formatDate(doc.uploadedAt)}
                </p>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-md text-[#2563EB] hover:bg-[#DBEAFE]">
                    <FiDownload className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-md text-[#DC2626] hover:bg-red-50">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#1E293B]">Upload Document</h3>
              <button
                onClick={() => setShowUpload(false)}
                className="text-[#64748B] hover:text-[#1E293B] p-1 rounded-md hover:bg-[#F8FAFF]"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
                  Document Type <span className="text-[#DC2626]">*</span>
                </label>
                <select className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                  <option>Transcript of Records</option>
                  <option>Curriculum Vitae</option>
                  <option>Board Certificate / PRC License</option>
                  <option>Service Record</option>
                  <option>Government ID</option>
                  <option>Other Credential</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5">
                  File <span className="text-[#DC2626]">*</span>
                </label>
                <div className="border-2 border-dashed border-[#E2E8F0] rounded-lg p-6 text-center hover:border-[#2563EB] cursor-pointer">
                  <FiUploadCloud className="w-8 h-8 text-[#2563EB] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#1E293B]">Click to upload</p>
                  <p className="text-xs text-[#64748B] mt-0.5">PDF, JPG, PNG · Max 10MB</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2.5 border border-[#E2E8F0] text-[#1E293B] rounded-lg text-sm font-semibold hover:bg-[#F8FAFF] order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowUpload(false)}
                  className="flex-1 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] order-1 sm:order-2"
                >
                  Upload Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 sm:p-5">
      <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-center gap-2.5">
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${color} text-base font-bold`}>
          {value}
        </span>
        <p className="text-xs text-[#64748B]">documents</p>
      </div>
    </div>
  )
}
