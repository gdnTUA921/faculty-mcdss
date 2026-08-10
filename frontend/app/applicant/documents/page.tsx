'use client'

import { useRef, useState } from 'react'
import {
  FiUpload,
  FiFileText,
  FiDownload,
  FiTrash2,
  FiX,
  FiUploadCloud,
  FiCalendar,
  FiLock,
} from 'react-icons/fi'
import StatusBadge from '@/components/shared/StatusBadge'
import { EmptyState, ErrorBanner, ErrorState, Spinner, SuccessBanner } from '@/components/shared/DataState'
import { ApiError } from '@/lib/api/client'
import {
  deleteDocument,
  downloadMyDocument,
  getMyApplications,
  getMyDocuments,
  uploadDocument,
} from '@/lib/api/applicant'
import { formatDate, formatFileSize, humanize } from '@/lib/format'
import { useResource } from '@/lib/useResource'
import type { DocumentRow } from '@/lib/types'

const MAX_BYTES = 10 * 1024 * 1024

const DOCUMENT_TYPES = [
  { value: 'resume', label: 'Resume / CV' },
  { value: 'transcript', label: 'Transcript of Records' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certification', label: 'Certification' },
  { value: 'license', label: 'Professional License' },
  { value: 'other', label: 'Other' },
]

export default function DocumentsPage() {
  const [showUpload, setShowUpload] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<DocumentRow | null>(null)

  const { data, loading, error, reload } = useResource(() => getMyDocuments(), [])
  const documents = data ?? []

  // Once an application is submitted, these files are part of a review packet HR
  // may already be reading, so they're locked. Drafts don't lock anything.
  const { data: applications } = useResource(() => getMyApplications(), [])
  const hasSubmitted = (applications ?? []).some((app) => app.status !== 'draft')

  async function handleDownload(doc: DocumentRow) {
    setActionError(null)
    try {
      await downloadMyDocument(doc.id, doc.file_name)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Download failed.')
    }
  }

  async function handleDelete(doc: DocumentRow) {
    setActionError(null)
    setBusyId(doc.id)
    try {
      await deleteDocument(doc.id)
      setNotice(`"${doc.file_name}" deleted.`)
      setConfirmDelete(null)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete the document.')
      setConfirmDelete(null)
    } finally {
      setBusyId(null)
    }
  }

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

      {notice && <SuccessBanner message={notice} onDismiss={() => setNotice(null)} />}
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <SummaryCard label="Total" value={documents.length} color="bg-blue-100 text-[#1E3A8A]" />
        <SummaryCard
          label="Verified"
          value={documents.filter((d) => d.is_verified).length}
          color="bg-green-100 text-green-700"
        />
        <SummaryCard
          label="Unverified"
          value={documents.filter((d) => !d.is_verified).length}
          color="bg-amber-100 text-amber-700"
        />
      </div>

      {hasSubmitted && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 mb-4">
          <FiLock className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-900">
            You&apos;ve submitted an application, so these documents are now part of a review packet
            and can no longer be deleted. You can still upload new ones. Contact HR if something needs
            to be removed or corrected.
          </p>
        </div>
      )}

      {/* Document list */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <Spinner label="Loading your documents…" />
        ) : documents.length === 0 ? (
          <EmptyState
            title="No documents uploaded yet"
            description="Upload your resume and supporting credentials — they're reused across every application."
            action={
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF]"
              >
                <FiUpload className="w-4 h-4" />
                Upload Document
              </button>
            }
          />
        ) : (
          <ul className="divide-y divide-[#E2E8F0]">
            {documents.map((doc) => (
              <li key={doc.id} className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-[#F8FAFF] border border-[#E2E8F0] flex items-center justify-center flex-shrink-0">
                    <FiFileText className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1E293B] truncate">
                      {humanize(doc.document_type)}
                    </p>
                    <p className="text-xs text-[#64748B] truncate">
                      {doc.file_name} · {formatFileSize(doc.file_size_bytes)}
                    </p>
                    <p className="text-xs text-[#94A3B8] flex items-center gap-1 mt-0.5">
                      <FiCalendar className="w-3 h-3" />
                      Uploaded {formatDate(doc.uploaded_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <StatusBadge status={doc.is_verified ? 'verified' : 'unverified'} />
                  <button
                    onClick={() => handleDownload(doc)}
                    className="text-[#2563EB] hover:text-[#1E3A8A] p-1.5 rounded-md hover:bg-[#DBEAFE]"
                    title={`Download ${doc.file_name}`}
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(doc)}
                    disabled={busyId === doc.id || doc.is_verified || hasSubmitted}
                    title={
                      doc.is_verified
                        ? 'Verified documents cannot be deleted'
                        : hasSubmitted
                          ? 'Locked — this document is part of a submitted application'
                          : `Delete ${doc.file_name}`
                    }
                    className="text-[#DC2626] hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={(name) => {
            setShowUpload(false)
            setNotice(`"${name}" uploaded.`)
            reload()
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-[#1E293B] mb-2">Delete this document?</h2>
            <p className="text-sm text-[#64748B] mb-5">
              <strong>{confirmDelete.file_name}</strong> will be permanently removed from your profile
              and from any application it was attached to.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-[#E2E8F0] text-[#64748B] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={busyId === confirmDelete.id}
                className="flex-1 bg-[#DC2626] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {busyId === confirmDelete.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void
  onUploaded: (fileName: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('resume')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function selectFile(selected: File) {
    if (selected.size > MAX_BYTES) {
      setError('That file is larger than 10MB. Please choose a smaller file.')
      return
    }
    setError(null)
    setFile(selected)
  }

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault()
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      await uploadDocument(file, documentType)
      onUploaded(file.name)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (Object.values(err.errors)[0]?.[0] ?? err.message)
          : 'Upload failed. Please try again.',
      )
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-bold text-[#1E293B]">Upload Document</h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] p-1" aria-label="Close">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6">
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

          <div className="mb-4">
            <label
              htmlFor="doc-type"
              className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wide mb-1.5"
            >
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              id="doc-type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {documentType === 'resume' && (
              <p className="text-xs text-[#64748B] mt-1.5">
                Resumes are parsed automatically to pre-fill your application forms.
              </p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0]
              if (selected) selectFile(selected)
            }}
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const dropped = e.dataTransfer.files?.[0]
              if (dropped) selectFile(dropped)
            }}
            className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-6 text-center bg-[#F8FAFF] mb-5"
          >
            <FiUploadCloud className="w-8 h-8 text-[#2563EB] mx-auto mb-2" />
            {file ? (
              <>
                <p className="text-sm font-semibold text-[#1E293B]">{file.name}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{formatFileSize(file.size)}</p>
              </>
            ) : (
              <p className="text-sm text-[#64748B]">Drag &amp; drop a file, or</p>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-sm font-semibold text-[#2563EB] hover:underline"
            >
              {file ? 'Choose a different file' : 'Browse files'}
            </button>
            <p className="text-xs text-[#94A3B8] mt-2">Max 10MB</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#E2E8F0] text-[#64748B] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex-1 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1E40AF] disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 text-center">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${color} mb-2`}>
        <FiFileText className="w-4 h-4" />
      </div>
      <p className="text-xl font-bold text-[#1E293B]">{value}</p>
      <p className="text-xs text-[#64748B]">{label}</p>
    </div>
  )
}
