'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiUploadCloud,
  FiFile,
  FiCheckCircle,
  FiInfo,
  FiZap,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi'
import { ErrorBanner, Spinner } from '@/components/shared/DataState'
import { ApiError } from '@/lib/api/client'
import {
  getMyDocuments,
  getMyProfile,
  getOpenPosition,
  startApplication,
  updateMyProfile,
  uploadDocument,
} from '@/lib/api/applicant'
import { formatFileSize } from '@/lib/format'
import { useResource } from '@/lib/useResource'
import type { DocumentRow, ParsedResume } from '@/lib/types'

const MAX_BYTES = 10 * 1024 * 1024

type Step = 'upload' | 'parsing' | 'confirm'

/*
 * The review step edits every field the parser produces. Inputs can't hold null,
 * so the form mirrors ParsedResume with plain strings and converts back on save.
 * `raw_text` is carried along untouched as provenance for entries that came from
 * the CV; entries the applicant adds simply don't have one.
 */
interface EducationForm {
  raw_text?: string
  degree: string
  field_of_study: string
  institution: string
  graduation_year: string
}

interface ExperienceForm {
  raw_text?: string
  position: string
  organization: string
  start_date: string
  end_date: string
  responsibilities: string[]
  courses_taught: string[]
}

interface CertificationForm {
  raw_text?: string
  name: string
  issuer: string
  date_obtained: string
  expiration_date: string
}

interface ResumeForm {
  name: string
  email: string
  phone: string
  address: string
  linkedin: string
  portfolio: string
  education: EducationForm[]
  experience: ExperienceForm[]
  certifications: CertificationForm[]
  skills: string[]
  research_interests: string[]
  publications: string[]
  research_projects: string[]
  professional_development: string[]
  awards: string[]
}

const EMPTY_FORM: ResumeForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  linkedin: '',
  portfolio: '',
  education: [],
  experience: [],
  certifications: [],
  skills: [],
  research_interests: [],
  publications: [],
  research_projects: [],
  professional_development: [],
  awards: [],
}

const BLANK_EDUCATION: EducationForm = {
  degree: '',
  field_of_study: '',
  institution: '',
  graduation_year: '',
}

const BLANK_EXPERIENCE: ExperienceForm = {
  position: '',
  organization: '',
  start_date: '',
  end_date: '',
  responsibilities: [],
  courses_taught: [],
}

const BLANK_CERTIFICATION: CertificationForm = {
  name: '',
  issuer: '',
  date_obtained: '',
  expiration_date: '',
}

/** Text-only sections the parser stores as `{ raw_text }` objects. */
const TEXT_SECTIONS = [
  ['publications', 'Publications'],
  ['research_projects', 'Research Projects'],
  ['professional_development', 'Professional Development'],
  ['awards', 'Awards & Honors'],
] as const

type TextSectionKey = (typeof TEXT_SECTIONS)[number][0]

function asText(value: unknown): string {
  return value == null ? '' : String(value)
}

function asObjects(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? (value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[])
    : []
}

function asTextList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function asRawTextList(value: unknown): string[] {
  return asObjects(value)
    .map((entry) => asText(entry.raw_text).trim())
    .filter(Boolean)
}

/** Normalizes the stored JSON into a fully-populated editable form. */
function toForm(parsed: Record<string, unknown> | null | undefined): ResumeForm {
  if (!parsed) return EMPTY_FORM

  return {
    name: asText(parsed.name),
    email: asText(parsed.email),
    phone: asText(parsed.phone),
    address: asText(parsed.address),
    linkedin: asText(parsed.linkedin),
    portfolio: asText(parsed.portfolio),
    education: asObjects(parsed.education).map((entry) => ({
      raw_text: asText(entry.raw_text) || undefined,
      degree: asText(entry.degree),
      field_of_study: asText(entry.field_of_study),
      institution: asText(entry.institution),
      graduation_year: asText(entry.graduation_year),
    })),
    experience: asObjects(parsed.experience).map((entry) => ({
      raw_text: asText(entry.raw_text) || undefined,
      position: asText(entry.position),
      organization: asText(entry.organization),
      start_date: asText(entry.start_date),
      end_date: asText(entry.end_date),
      responsibilities: asTextList(entry.responsibilities),
      courses_taught: asTextList(entry.courses_taught),
    })),
    certifications: asObjects(parsed.certifications).map((entry) => ({
      raw_text: asText(entry.raw_text) || undefined,
      name: asText(entry.name),
      issuer: asText(entry.issuer),
      date_obtained: asText(entry.date_obtained),
      expiration_date: asText(entry.expiration_date),
    })),
    skills: asTextList(parsed.skills),
    research_interests: asTextList(parsed.research_interests),
    publications: asRawTextList(parsed.publications),
    research_projects: asRawTextList(parsed.research_projects),
    professional_development: asRawTextList(parsed.professional_development),
    awards: asRawTextList(parsed.awards),
  }
}

/** Blank string -> null, so an unanswered field stays empty rather than "". */
function orNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function cleanList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean)
}

/**
 * Builds the payload. Entries where every field is blank are dropped, so only
 * fields that were actually filled in reach the database.
 */
function toPayload(form: ResumeForm): Partial<ParsedResume> {
  const education = form.education
    .filter((e) => [e.degree, e.field_of_study, e.institution, e.graduation_year].some((v) => v.trim()))
    .map((e) => ({
      ...(e.raw_text ? { raw_text: e.raw_text } : {}),
      degree: orNull(e.degree),
      field_of_study: orNull(e.field_of_study),
      institution: orNull(e.institution),
      graduation_year: orNull(e.graduation_year),
    }))

  const experience = form.experience
    .filter(
      (e) =>
        [e.position, e.organization, e.start_date, e.end_date].some((v) => v.trim()) ||
        cleanList(e.responsibilities).length > 0 ||
        cleanList(e.courses_taught).length > 0,
    )
    .map((e) => ({
      ...(e.raw_text ? { raw_text: e.raw_text } : {}),
      position: orNull(e.position),
      organization: orNull(e.organization),
      start_date: orNull(e.start_date),
      end_date: orNull(e.end_date),
      responsibilities: cleanList(e.responsibilities),
      courses_taught: cleanList(e.courses_taught),
    }))

  const certifications = form.certifications
    .filter((c) => [c.name, c.issuer, c.date_obtained, c.expiration_date].some((v) => v.trim()))
    .map((c) => ({
      ...(c.raw_text ? { raw_text: c.raw_text } : {}),
      name: orNull(c.name),
      issuer: orNull(c.issuer),
      date_obtained: orNull(c.date_obtained),
      expiration_date: orNull(c.expiration_date),
    }))

  return {
    name: orNull(form.name),
    email: orNull(form.email),
    phone: orNull(form.phone),
    address: orNull(form.address),
    linkedin: orNull(form.linkedin),
    portfolio: orNull(form.portfolio),
    education,
    experience,
    certifications,
    skills: cleanList(form.skills),
    research_interests: cleanList(form.research_interests),
    publications: cleanList(form.publications).map((raw_text) => ({ raw_text })),
    research_projects: cleanList(form.research_projects).map((raw_text) => ({ raw_text })),
    professional_development: cleanList(form.professional_development).map((raw_text) => ({ raw_text })),
    awards: cleanList(form.awards).map((raw_text) => ({ raw_text })),
  }
}

export default function ResumeUploadPage() {
  const params = useParams<{ positionId: string }>()
  const router = useRouter()
  const positionId = params.positionId

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [continuing, setContinuing] = useState(false)
  // The editable parse, plus a snapshot of what it looked like on arrival so an
  // untouched review step doesn't issue a pointless write.
  const [form, setForm] = useState<ResumeForm>(EMPTY_FORM)
  const [snapshot, setSnapshot] = useState<string>(JSON.stringify(EMPTY_FORM))
  // The resume already on file, when returning to an application in progress.
  const [existingResume, setExistingResume] = useState<DocumentRow | null>(null)

  const { data: position, loading } = useResource(() => getOpenPosition(positionId), [positionId])

  // Someone continuing a draft arrives here with a resume already uploaded, so
  // load it and show the saved details for editing instead of demanding a
  // re-upload — otherwise the only way back to these fields is to replace the CV.
  const { data: existing, loading: checkingExisting } = useResource(
    async () => ({
      profile: await getMyProfile(),
      documents: await getMyDocuments().catch(() => [] as DocumentRow[]),
    }),
    [],
  )

  const seeded = useRef(false)

  useEffect(() => {
    if (!existing || seeded.current) return
    seeded.current = true

    const resume =
      existing.documents.find((doc) => doc.document_type?.toLowerCase() === 'resume') ?? null
    const saved = toForm(existing.profile?.parsed_resume_data)
    const hasSavedDetails = JSON.stringify(saved) !== JSON.stringify(EMPTY_FORM)

    if (resume || hasSavedDetails) {
      setExistingResume(resume)
      setForm(saved)
      setSnapshot(JSON.stringify(saved))
      setStep('confirm')
    }
  }, [existing])

  const dirty = JSON.stringify(form) !== snapshot

  function patch(changes: Partial<ResumeForm>) {
    setForm((prev) => ({ ...prev, ...changes }))
  }

  /** Replaces one entry in a list section. */
  function patchEntry<K extends 'education' | 'experience' | 'certifications'>(
    section: K,
    index: number,
    changes: Partial<ResumeForm[K][number]>,
  ) {
    setForm((prev) => ({
      ...prev,
      [section]: prev[section].map((entry, i) => (i === index ? { ...entry, ...changes } : entry)),
    }))
  }

  function removeEntry(section: 'education' | 'experience' | 'certifications', index: number) {
    setForm((prev) => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }))
  }

  async function handleFile(selected: File) {
    setError(null)

    if (selected.size > MAX_BYTES) {
      setError('That file is larger than 10MB. Please upload a smaller file.')
      return
    }

    setFile(selected)
    setStep('parsing')

    try {
      await uploadDocument(selected, 'resume')
      // Read the profile back directly — the upload writes parsed_resume_data onto
      // it, and the review step needs those values to seed its inputs right away.
      const fresh = await getMyProfile()
      const parsed = toForm(fresh?.parsed_resume_data)
      setForm(parsed)
      setSnapshot(JSON.stringify(parsed))
      setStep('confirm')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (Object.values(err.errors)[0]?.[0] ?? err.message)
          : 'Upload failed. Please try again.',
      )
      setStep('upload')
      setFile(null)
    }
  }

  /** Persists any corrections, creates (or reuses) the draft, then moves on. */
  async function handleContinue() {
    setContinuing(true)
    setError(null)
    try {
      if (dirty) await updateMyProfile({ parsed_resume_data: toPayload(form) })
      await startApplication(positionId)
      router.push(`/applicant/apply/${positionId}/form`)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (Object.values(err.errors)[0]?.[0] ?? err.message)
          : 'Could not start the application.',
      )
      setContinuing(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        href="/applicant/positions"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] mb-4"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Positions
      </Link>

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
          <span className="font-semibold text-[#2563EB]">Step 1 of 2</span>
          <span>—</span>
          <span>Resume Upload</span>
        </div>
        <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-[#2563EB] rounded-full" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] mb-1 tracking-tight">
          {step === 'confirm' ? 'Your Resume Details' : 'Upload Your Resume'}
        </h1>
        <p className="text-sm text-[#64748B] mb-6">
          {loading
            ? 'Loading position…'
            : position
              ? `Applying for ${position.title}${position.department ? ` — ${position.department.code}` : ''}.`
              : 'Your CV is parsed to help you fill in the application form.'}
        </p>

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {checkingExisting && <Spinner label="Loading your details…" />}

        {!checkingExisting && step === 'upload' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0]
                if (selected) handleFile(selected)
              }}
            />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const dropped = e.dataTransfer.files?.[0]
                if (dropped) handleFile(dropped)
              }}
              className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-8 sm:p-12 text-center bg-[#F8FAFF] hover:border-[#2563EB] hover:bg-blue-50 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-[#DBEAFE] flex items-center justify-center mx-auto mb-4">
                <FiUploadCloud className="w-8 h-8 text-[#2563EB]" />
              </div>
              <p className="text-base font-semibold text-[#1E293B] mb-1">
                Drag &amp; drop your resume here
              </p>
              <p className="text-sm text-[#64748B] mb-5">or click to browse files</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors"
              >
                <FiFile className="w-4 h-4" />
                Choose File
              </button>
              <p className="text-xs text-[#64748B] mt-4">
                Supported formats: <span className="font-semibold">PDF, DOC, DOCX</span> · Max 10MB
              </p>
            </div>

            <div className="mt-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
              <FiInfo className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#1E3A8A]">
                <span className="font-semibold">Tip:</span> A well-formatted CV produces more accurate
                parsing. Make sure your education, experience, and certifications are clearly labeled.
              </p>
            </div>

            <p className="mt-4 text-center text-xs text-[#64748B]">
              A resume is required to continue your application.
            </p>
          </>
        )}

        {step === 'parsing' && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#DBEAFE] flex items-center justify-center mx-auto mb-5 animate-pulse">
              <FiZap className="w-8 h-8 text-[#2563EB]" />
            </div>
            <p className="text-lg font-bold text-[#1E293B] mb-1">Uploading and parsing your resume…</p>
            <p className="text-sm text-[#64748B]">
              Extracting your education, experience, and credentials.
            </p>
            <div className="max-w-xs mx-auto mt-6 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-[#2563EB] rounded-full animate-pulse" />
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div>
            <div className="border border-[#16A34A] bg-green-50 rounded-xl p-5 mb-6 flex items-start gap-3">
              <FiCheckCircle className="w-5 h-5 text-[#16A34A] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-[#15803D] text-sm mb-0.5">
                  {file ? 'Resume uploaded' : 'Resume on file'}
                </p>
                <p className="text-xs text-green-700">
                  {file
                    ? `${file.name} · ${formatFileSize(file.size)}`
                    : (existingResume?.file_name ??
                      'Using the details saved from your earlier upload.')}
                </p>
              </div>
            </div>

            <div className="flex items-baseline justify-between mb-1">
              <p className="text-sm font-semibold text-[#1E293B]">Review Your Details</p>
              {dirty && <span className="text-xs text-[#2563EB]">Edited — saved when you continue</span>}
            </div>
            <p className="text-xs text-[#64748B] mb-4">
              Everything below was read from your resume. Correct anything that landed in the wrong
              place, and add whatever the parser missed. Blank fields are left blank — nothing is
              guessed on your behalf.
            </p>

            <SectionCard title="Contact Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <TextField label="Full Name" value={form.name} onChange={(v) => patch({ name: v })} />
                <TextField label="Email" value={form.email} onChange={(v) => patch({ email: v })} />
                <TextField label="Phone" value={form.phone} onChange={(v) => patch({ phone: v })} />
                <TextField
                  label="Address / Location"
                  value={form.address}
                  onChange={(v) => patch({ address: v })}
                />
                <TextField
                  label="LinkedIn"
                  value={form.linkedin}
                  onChange={(v) => patch({ linkedin: v })}
                />
                <TextField
                  label="Portfolio / Website"
                  value={form.portfolio}
                  onChange={(v) => patch({ portfolio: v })}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Education"
              addLabel="Add education"
              onAdd={() => patch({ education: [...form.education, { ...BLANK_EDUCATION }] })}
              emptyHint="No education entries were found in your resume."
              isEmpty={form.education.length === 0}
            >
              {form.education.map((entry, index) => (
                <EntryCard key={index} onRemove={() => removeEntry('education', index)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <TextField
                      label="Degree"
                      value={entry.degree}
                      onChange={(v) => patchEntry('education', index, { degree: v })}
                    />
                    <TextField
                      label="Field of Study"
                      value={entry.field_of_study}
                      onChange={(v) => patchEntry('education', index, { field_of_study: v })}
                    />
                    <TextField
                      label="Institution"
                      value={entry.institution}
                      onChange={(v) => patchEntry('education', index, { institution: v })}
                    />
                    <TextField
                      label="Graduation Year"
                      value={entry.graduation_year}
                      onChange={(v) => patchEntry('education', index, { graduation_year: v })}
                    />
                  </div>
                </EntryCard>
              ))}
            </SectionCard>

            <SectionCard
              title="Experience"
              description="Work, teaching, and academic experience together."
              addLabel="Add experience"
              onAdd={() => patch({ experience: [...form.experience, { ...BLANK_EXPERIENCE }] })}
              emptyHint="No experience entries were found in your resume."
              isEmpty={form.experience.length === 0}
            >
              {form.experience.map((entry, index) => (
                <EntryCard key={index} onRemove={() => removeEntry('experience', index)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <TextField
                      label="Position"
                      value={entry.position}
                      onChange={(v) => patchEntry('experience', index, { position: v })}
                    />
                    <TextField
                      label="Organization"
                      value={entry.organization}
                      onChange={(v) => patchEntry('experience', index, { organization: v })}
                    />
                    <TextField
                      label="Start Date"
                      value={entry.start_date}
                      onChange={(v) => patchEntry('experience', index, { start_date: v })}
                    />
                    <TextField
                      label="End Date"
                      value={entry.end_date}
                      onChange={(v) => patchEntry('experience', index, { end_date: v })}
                    />
                  </div>
                  <ListEditor
                    label="Responsibilities"
                    values={entry.responsibilities}
                    placeholder="e.g. Delivered undergraduate lectures"
                    onChange={(values) =>
                      patchEntry('experience', index, { responsibilities: values })
                    }
                  />
                  <ListEditor
                    label="Courses Taught"
                    values={entry.courses_taught}
                    placeholder="e.g. Data Structures"
                    onChange={(values) => patchEntry('experience', index, { courses_taught: values })}
                  />
                </EntryCard>
              ))}
            </SectionCard>

            <SectionCard
              title="Certifications & Licenses"
              addLabel="Add certification or license"
              onAdd={() =>
                patch({ certifications: [...form.certifications, { ...BLANK_CERTIFICATION }] })
              }
              emptyHint="No certifications or licenses were found in your resume."
              isEmpty={form.certifications.length === 0}
            >
              {form.certifications.map((entry, index) => (
                <EntryCard key={index} onRemove={() => removeEntry('certifications', index)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <TextField
                      label="Name"
                      value={entry.name}
                      onChange={(v) => patchEntry('certifications', index, { name: v })}
                    />
                    <TextField
                      label="Issuer"
                      value={entry.issuer}
                      onChange={(v) => patchEntry('certifications', index, { issuer: v })}
                    />
                    <TextField
                      label="Date Obtained"
                      value={entry.date_obtained}
                      onChange={(v) => patchEntry('certifications', index, { date_obtained: v })}
                    />
                    <TextField
                      label="Expiration Date"
                      value={entry.expiration_date}
                      onChange={(v) => patchEntry('certifications', index, { expiration_date: v })}
                    />
                  </div>
                </EntryCard>
              ))}
            </SectionCard>

            <SectionCard title="Skills">
              <ListEditor
                values={form.skills}
                placeholder="e.g. Curriculum Design"
                onChange={(values) => patch({ skills: values })}
              />
            </SectionCard>

            <SectionCard title="Research Interests">
              <ListEditor
                values={form.research_interests}
                placeholder="e.g. Machine Learning"
                onChange={(values) => patch({ research_interests: values })}
              />
            </SectionCard>

            {TEXT_SECTIONS.map(([key, label]) => (
              <SectionCard key={key} title={label}>
                <ListEditor
                  values={form[key as TextSectionKey]}
                  placeholder={`Add ${label.toLowerCase()}`}
                  onChange={(values) => patch({ [key]: values } as Partial<ResumeForm>)}
                />
              </SectionCard>
            ))}

            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 mb-6">
              <FiInfo className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-900">
                Parsed data is a convenience only — it is <strong>not</strong> used for scoring. Your
                answers on the next page are what get evaluated.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={() => {
                  setStep('upload')
                  setFile(null)
                  setExistingResume(null)
                  setForm(EMPTY_FORM)
                  setSnapshot(JSON.stringify(EMPTY_FORM))
                }}
                className="px-4 py-2.5 border border-[#E2E8F0] text-[#1E293B] rounded-lg text-sm font-semibold hover:bg-[#F8FAFF] transition-colors"
              >
                Re-upload
              </button>
              <button
                onClick={handleContinue}
                disabled={continuing}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-60"
              >
                {continuing ? 'Starting…' : 'Continue to Application Form'}
                <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionCard({
  title,
  description,
  children,
  onAdd,
  addLabel,
  emptyHint,
  isEmpty,
}: {
  title: string
  description?: string
  children: React.ReactNode
  onAdd?: () => void
  addLabel?: string
  emptyHint?: string
  isEmpty?: boolean
}) {
  return (
    <div className="border border-[#E2E8F0] rounded-xl p-4 mb-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-bold text-[#1E293B]">{title}</h2>
          {description && <p className="text-xs text-[#64748B] mt-0.5">{description}</p>}
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 px-2 py-1 rounded-md flex-shrink-0"
          >
            <FiPlus className="w-3.5 h-3.5" />
            {addLabel ?? 'Add'}
          </button>
        )}
      </div>

      {isEmpty && emptyHint && (
        <p className="text-xs text-[#94A3B8] bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg px-3 py-2 mb-3">
          {emptyHint} You can add one if you&apos;d like it on record.
        </p>
      )}

      {children}
    </div>
  )
}

function EntryCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg p-3 mb-3 last:mb-0">
      <div className="flex justify-end -mt-1 -mr-1 mb-1">
        <button
          type="button"
          onClick={onRemove}
          className="text-[#DC2626] hover:bg-red-50 rounded-md p-1.5"
          title="Remove this entry"
          aria-label="Remove this entry"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {children}
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const inputId = `parsed-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <div>
      <label htmlFor={inputId} className="block text-xs text-[#64748B] uppercase tracking-wide mb-1">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        maxLength={500}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-[#E2E8F0] rounded-md px-2.5 py-1.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}

/** A repeatable single-line list: skills, responsibilities, publications, etc. */
function ListEditor({
  label,
  values,
  placeholder,
  onChange,
}: {
  label?: string
  values: string[]
  placeholder?: string
  onChange: (values: string[]) => void
}) {
  return (
    <div className={label ? 'mt-3' : undefined}>
      {label && (
        <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">{label}</p>
      )}
      {values.length > 0 && (
        <div className="space-y-2 mb-2">
          {values.map((value, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                maxLength={500}
                value={value}
                placeholder={placeholder}
                onChange={(e) =>
                  onChange(values.map((item, i) => (i === index ? e.target.value : item)))
                }
                className="flex-1 bg-white border border-[#E2E8F0] rounded-md px-2.5 py-1.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => onChange(values.filter((_, i) => i !== index))}
                className="text-[#DC2626] hover:bg-red-50 rounded-md p-1.5 flex-shrink-0"
                title="Remove"
                aria-label="Remove"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange([...values, ''])}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 px-2 py-1 rounded-md"
      >
        <FiPlus className="w-3.5 h-3.5" />
        Add item
      </button>
    </div>
  )
}
