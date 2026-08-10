/** Admin + director API surface. Directors get the same calls, scoped server-side. */

import { downloadFile, request } from './client'
import type {
  ApplicationDetail,
  ApplicationRow,
  AssignmentRunDetail,
  AssignmentRunSummary,
  Criterion,
  CriterionOption,
  DashboardStats,
  Department,
  DocumentRow,
  Envelope,
  HiringRound,
  Paginated,
  PoolEntry,
  Position,
  RankingRow,
  ScoreBreakdown,
  StaffAccount,
  StatusHistoryEntry,
} from '../types'

// ─── Dashboard & reference data ──────────────────────────────────────────────

export const getDashboardStats = () =>
  request<Envelope<DashboardStats>>('/dashboard/stats').then((r) => r.data)

export const getDepartments = () =>
  request<Envelope<Department[]>>('/departments').then((r) => r.data)

// ─── Hiring rounds ───────────────────────────────────────────────────────────

export const getHiringRounds = (status?: string) =>
  request<Envelope<HiringRound[]>>('/hiring-rounds', { query: { status } }).then((r) => r.data)

export interface HiringRoundInput {
  name: string
  semester: string
  academic_year: number
  start_date: string
  end_date: string
  status?: string
}

export const createHiringRound = (input: HiringRoundInput) =>
  request<Envelope<HiringRound>>('/hiring-rounds', { method: 'POST', body: input }).then((r) => r.data)

/** Details only -- status moves go through closeHiringRound / archiveHiringRound. */
export type HiringRoundEditInput = Omit<HiringRoundInput, 'status'>

export const updateHiringRound = (id: string, input: Partial<HiringRoundEditInput>) =>
  request<Envelope<HiringRound>>(`/hiring-rounds/${id}`, { method: 'PUT', body: input }).then((r) => r.data)

export const closeHiringRound = (id: string) =>
  request<{ message: string; data?: unknown }>(`/hiring-rounds/${id}/close`, { method: 'POST' })

export const archiveHiringRound = (id: string) =>
  request<{ message: string; data?: unknown }>(`/hiring-rounds/${id}/archive`, { method: 'POST' })

// ─── Positions ───────────────────────────────────────────────────────────────

export type PositionFilters = {
  status?: string
  department_id?: string
  search?: string
}

/** Phase 2 endpoint — returns a bare array, not an envelope. */
export const getPositions = (filters: PositionFilters = {}) =>
  request<Position[]>('/positions', { query: filters })

export const getPosition = (id: string) => request<Position>(`/positions/${id}`)

export interface PositionInput {
  department_id: string
  title: string
  description?: string | null
  target_applicant_type: string
  slots_available: number
  application_deadline?: string | null
  status?: string
}

export const createPosition = (input: PositionInput) =>
  request<Position>('/positions', { method: 'POST', body: input })

export const updatePosition = (id: string, input: Partial<PositionInput>) =>
  request<Position>(`/positions/${id}`, { method: 'PUT', body: input })

export const setPositionStatus = (id: string, status: string) =>
  request<Envelope<Position>>(`/positions/${id}/status`, { method: 'PATCH', body: { status } })

// ─── Criteria ────────────────────────────────────────────────────────────────

export const getCriteria = (positionId: string) =>
  request<Criterion[]>(`/positions/${positionId}/criteria`)

export interface CriterionInput {
  name: string
  description?: string | null
  data_type: string
  weight: number
  min_value?: number | null
  max_value?: number | null
  is_required?: boolean
  display_order?: number
}

export const createCriterion = (positionId: string, input: CriterionInput) =>
  request<Envelope<Criterion>>(`/positions/${positionId}/criteria`, { method: 'POST', body: input })
    .then((r) => r.data)

export const updateCriterion = (criterionId: string, input: Partial<CriterionInput>) =>
  request<Envelope<Criterion>>(`/criteria/${criterionId}`, { method: 'PUT', body: input }).then((r) => r.data)

export const deleteCriterion = (criterionId: string) =>
  request<{ message: string }>(`/criteria/${criterionId}`, { method: 'DELETE' })

// ─── Criterion options (select-type criteria) ────────────────────────────────

export interface CriterionOptionInput {
  label: string
  value: string
  /** 0–1 normalized score awarded when this option is chosen. */
  score_value: number
  display_order?: number
}

export const getCriterionOptions = (criterionId: string) =>
  request<CriterionOption[]>(`/criteria/${criterionId}/options`)

export const createCriterionOption = (criterionId: string, input: CriterionOptionInput) =>
  request<CriterionOption>(`/criteria/${criterionId}/options`, { method: 'POST', body: input })

export const updateCriterionOption = (optionId: string, input: Partial<CriterionOptionInput>) =>
  request<CriterionOption>(`/criterion-options/${optionId}`, { method: 'PUT', body: input })

export const deleteCriterionOption = (optionId: string) =>
  request<{ message: string }>(`/criterion-options/${optionId}`, { method: 'DELETE' })

// ─── Applicants ──────────────────────────────────────────────────────────────

export type ApplicationFilters = {
  status?: string
  position_id?: string
  hiring_round_id?: string
  department_id?: string
  applicant_type?: string
  min_score?: number
  search?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
  include_drafts?: boolean
  page?: number
  per_page?: number
}

export const getApplications = (filters: ApplicationFilters = {}) =>
  request<Paginated<ApplicationRow>>('/applications', { query: filters })

export const getApplication = (id: string) =>
  request<Envelope<ApplicationDetail>>(`/applications/${id}`).then((r) => r.data)

export const getApplicationDocuments = (id: string) =>
  request<Envelope<DocumentRow[]>>(`/applications/${id}/documents`).then((r) => r.data)

export const getStatusHistory = (id: string) =>
  request<Envelope<StatusHistoryEntry[]>>(`/applications/${id}/status-history`).then((r) => r.data)

export const updateApplicationStatus = (id: string, status: string, notes?: string) =>
  request<{ message: string; data?: unknown }>(`/applications/${id}/status`, {
    method: 'PATCH',
    body: { status, ...(notes ? { notes } : {}) },
  })

export const exportApplicants = (filters: ApplicationFilters = {}) =>
  downloadFile('/admin/applicants/export', filters, 'applicants.csv')

export const downloadDocument = (documentId: string, fileName: string) =>
  downloadFile(`/documents/${documentId}/download`, undefined, fileName)

/** Admin sign-off on a credential. Pass false to reverse a mistaken verification. */
export const setDocumentVerified = (documentId: string, isVerified: boolean) =>
  request<{
    id: string
    is_verified: boolean
    verified_by: string | null
    verified_at: string | null
    message: string
  }>(`/documents/${documentId}/verify`, {
    method: 'PATCH',
    body: { is_verified: isVerified },
  })

// ─── Scoring & ranking ───────────────────────────────────────────────────────

export const scorePosition = (positionId: string) =>
  request<{ message: string }>(`/positions/${positionId}/score`, { method: 'POST' })

export const getRankings = (positionId: string) =>
  request<RankingRow[]>(`/positions/${positionId}/rankings`)

export const getScoreBreakdown = (applicationId: string) =>
  request<ScoreBreakdown>(`/applications/${applicationId}/score-breakdown`)

// ─── Assignment runs ─────────────────────────────────────────────────────────

export const getAssignmentRuns = (query: { hiring_round_id?: string; status?: string; limit?: number } = {}) =>
  request<Envelope<AssignmentRunSummary[]>>('/assignment-runs', { query }).then((r) => r.data)

export const getAssignmentRun = (id: string) => request<AssignmentRunDetail>(`/assignment-runs/${id}`)

export interface AssignmentRunInput {
  hiring_round_id: string
  scope_applicant_type: string
  scope_position_ids?: string[]
  scope_department_ids?: string[]
}

export const createAssignmentRun = (input: AssignmentRunInput) =>
  request<{ message: string; assignment_run: AssignmentRunDetail }>('/assignment-runs', {
    method: 'POST',
    body: input,
  })

// ─── Applicant pool ──────────────────────────────────────────────────────────

export type PoolFilters = {
  hiring_round_id?: string
  semester?: string
  position_id?: string
  department_id?: string
  applicant_type?: string
  pool_status?: string
}

export const getApplicantPool = (filters: PoolFilters = {}) =>
  request<Envelope<PoolEntry[]>>('/applicant-pool', { query: filters }).then((r) => r.data)

export const reengagePoolEntry = (id: string) =>
  request<{ message: string }>(`/applicant-pool/${id}/reengage`, { method: 'POST' })

export const updatePoolStatus = (id: string, status: 'inactive' | 'expired') =>
  request<{ message: string }>(`/applicant-pool/${id}/status`, { method: 'PATCH', body: { status } })

// ─── Staff accounts ──────────────────────────────────────────────────────────

export const getStaffAccounts = (query: { role?: string; search?: string; is_active?: boolean } = {}) =>
  request<Envelope<StaffAccount[]>>('/admin/staff-accounts', { query }).then((r) => r.data)

export interface StaffAccountInput {
  first_name: string
  last_name: string
  email: string
  role: string
  phone?: string | null
}

export const createStaffAccount = (input: StaffAccountInput) =>
  request<{ message: string; user: { id: string; email: string; role: string } }>('/admin/staff-accounts', {
    method: 'POST',
    body: input,
  })

export const resendStaffInvite = (userId: string) =>
  request<{ message: string }>(`/admin/staff-accounts/${userId}/resend-invite`, { method: 'POST' })

export const setStaffActive = (userId: string, isActive: boolean) =>
  request<{ message: string }>(`/admin/staff-accounts/${userId}/status`, {
    method: 'PATCH',
    body: { is_active: isActive },
  })
