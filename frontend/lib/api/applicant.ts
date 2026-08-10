/** Applicant portal API surface. */

import { downloadFile, getStoredUser, request, storeSession, type AuthUser } from './client'
import type {
  ApplicantPosition,
  ApplicantProfile,
  DocumentRow,
  Envelope,
  MyApplication,
  MyApplicationDetail,
  MyPoolStatus,
  NotificationList,
  ParsedResume,
  PositionForm,
  PositionFormField,
  PositionFormFieldPayload,
} from '../types'

// ─── Positions ───────────────────────────────────────────────────────────────

export const getOpenPositions = (query: { department_id?: string; search?: string; include_expired?: boolean } = {}) =>
  request<Envelope<ApplicantPosition[]>>('/applicant/positions', { query }).then((r) => r.data)

export const getOpenPosition = (id: string) =>
  request<Envelope<ApplicantPosition>>(`/applicant/positions/${id}`).then((r) => r.data)

/**
 * PositionFormController returns `{ position, fields }` with each field keyed by
 * `criterion_id`. Older shapes (a bare array, or `criteria`) are still accepted
 * because the Phase 4 envelope has varied; every shape is normalised to an
 * `id`-keyed array so callers index answers the same way as any other model.
 */
const normaliseFormFields = (rows: PositionFormFieldPayload[]): PositionFormField[] =>
  rows
    .map(({ criterion_id, id, ...rest }) => ({ ...rest, id: criterion_id ?? id ?? '' }))
    .filter((field) => field.id !== '')

export const getPositionForm = async (positionId: string): Promise<PositionFormField[]> => {
  const body = await request<PositionForm | Envelope<PositionForm> | PositionFormFieldPayload[]>(
    `/positions/${positionId}/form`,
  )

  if (Array.isArray(body)) return normaliseFormFields(body)

  const form = 'data' in body && body.data ? body.data : (body as PositionForm)

  if (Array.isArray(form.fields)) return normaliseFormFields(form.fields)
  if (Array.isArray(form.criteria)) return normaliseFormFields(form.criteria)
  return []
}

// ─── Applications ────────────────────────────────────────────────────────────

export const getMyApplications = (status?: string) =>
  request<Envelope<MyApplication[]>>('/applicant/applications', { query: { status } }).then((r) => r.data)

export const getMyApplication = (id: string) =>
  request<Envelope<MyApplicationDetail>>(`/applicant/applications/${id}`).then((r) => r.data)

/** Idempotent server-side: an existing draft for the position is returned as-is. */
export const startApplication = (positionId: string) =>
  request<{ id: string; status: string }>('/applications', {
    method: 'POST',
    body: { position_id: positionId },
  })

export interface FormAnswer {
  criterion_id: string
  raw_value: string
}

export const saveApplicationResponses = (applicationId: string, responses: FormAnswer[]) =>
  request<{ message: string }>(`/applications/${applicationId}`, {
    method: 'PUT',
    body: { responses },
  })

export const submitApplication = (applicationId: string) =>
  request<{ message: string; data: { id: string; status: string } }>(
    `/applications/${applicationId}/submit`,
    { method: 'POST' },
  )

export const getApplicationResponses = (applicationId: string) =>
  request<Envelope<{ criterion_id: string; raw_value: string | null }[]> |
    { criterion_id: string; raw_value: string | null }[]>(
    `/applications/${applicationId}/responses`,
  ).then((body) => (Array.isArray(body) ? body : body.data))

// ─── Documents ───────────────────────────────────────────────────────────────

/** Phase 4 endpoint returns a bare array. */
export const getMyDocuments = () => request<DocumentRow[]>('/documents')

export const uploadDocument = (file: File, documentType: string, applicationId?: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('document_type', documentType)
  if (applicationId) formData.append('application_id', applicationId)

  return request<DocumentRow>('/documents', { method: 'POST', formData })
}

export const deleteDocument = (id: string) =>
  request<{ message: string }>(`/documents/${id}`, { method: 'DELETE' })

export const downloadMyDocument = (id: string, fileName: string) =>
  downloadFile(`/documents/${id}/download`, undefined, fileName)

// ─── Profile ─────────────────────────────────────────────────────────────────

export const getMyProfile = () =>
  request<Envelope<ApplicantProfile> | ApplicantProfile>('/applicant/profile').then((body) =>
    'data' in body ? body.data : body,
  )

/**
 * The only fields ApplicantProfileController@update accepts. Name, email and
 * phone live on the users table and have no update endpoint, so the profile
 * form renders them read-only.
 */
export interface ProfileInput {
  institution_email?: string | null
  summary?: string | null
  /**
   * Corrections to the parsed CV. Merged server-side over the stored parse, so a
   * section sent here replaces the stored one wholesale — that is what lets the
   * applicant delete an entry the parser got wrong.
   */
  parsed_resume_data?: Partial<ParsedResume>
}

export const updateMyProfile = (input: ProfileInput) =>
  request<Envelope<ApplicantProfile> | ApplicantProfile>('/applicant/profile', {
    method: 'PUT',
    body: input,
  }).then((body) => ('data' in body ? body.data : body))

export interface ChangePasswordInput {
  current_password: string
  password: string
  password_confirmation: string
}

/**
 * Revokes every existing token server-side and issues a replacement. The new
 * token must be stored or the current session dies on the next request.
 */
export const changePassword = async (input: ChangePasswordInput) => {
  const result = await request<{ message: string; token: string }>('/auth/change-password', {
    method: 'POST',
    body: input,
  })

  const user = getStoredUser()
  if (user && result.token) storeSession(result.token, user)

  return result
}

export const getMyPoolStatus = () =>
  request<Envelope<MyPoolStatus[]>>('/applicant/pool-status').then((r) => r.data)

// ─── Notifications (all roles) ───────────────────────────────────────────────

export const getNotifications = (unreadOnly = false) =>
  request<NotificationList>('/notifications', { query: { unread_only: unreadOnly || undefined } })

export const markNotificationRead = (id: string) =>
  request<{ message: string }>(`/notifications/${id}/read`, { method: 'PATCH' })

export const markAllNotificationsRead = () =>
  request<{ message: string; updated_count: number }>('/notifications/read-all', { method: 'POST' })

// ─── Registration (public) ───────────────────────────────────────────────────

/** Self-registration is always external — the role is fixed server-side. */
export interface RegisterInput {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string | null
}

/** Returns a usable token, so the caller can sign the new applicant straight in. */
export const register = (input: RegisterInput) =>
  request<{ message: string; token: string; user: AuthUser }>('/register', {
    method: 'POST',
    body: input,
    skipAuthRedirect: true,
  })
