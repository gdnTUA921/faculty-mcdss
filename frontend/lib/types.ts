/** Response shapes returned by the Laravel API. Field names are snake_case to match the wire format. */

export type ApplicationStatus =
  | 'draft'
  | 'applied'
  | 'for_interview'
  | 'for_review'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

export type PositionStatus = 'open' | 'closed' | 'filled'
export type TargetApplicantType = 'external' | 'internal' | 'both'
export type ApplicantType = 'external' | 'internal'
export type RoundStatus = 'active' | 'closed' | 'archived'
export type CriterionDataType = 'numeric' | 'text' | 'boolean' | 'select'

/** List endpoints wrap their payload; a few legacy Phase 2 endpoints return bare arrays. */
export interface Envelope<T> {
  data: T
}

export interface Paginated<T> {
  data: T[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

export interface DepartmentRef {
  id: string
  name: string
  code: string
}

export interface Department extends DepartmentRef {
  description: string | null
  is_active: boolean
  open_positions_count: number
  director: {
    id: string
    first_name: string
    last_name: string
    full_name: string
    email: string
  } | null
}

export interface HiringRound {
  id: string
  name: string
  semester: string
  academic_year: number
  start_date: string | null
  end_date: string | null
  status: RoundStatus
  applications_count: number
  created_at: string | null
}

export interface HiringRoundRef {
  id: string
  name: string
  semester?: string
  academic_year?: number
}

/** Columns are label/value/score_value — matches criterion_options exactly. */
export interface CriterionOption {
  id: string
  criterion_id: string
  label: string
  value: string
  /** 0–1 normalized score awarded when this option is chosen. */
  score_value: string | number | null
  display_order: number
}

export interface Criterion {
  id: string
  position_id: string
  name: string
  description: string | null
  data_type: CriterionDataType
  weight: string | number
  min_value: string | number | null
  max_value: string | number | null
  is_required: boolean
  display_order: number
  options?: CriterionOption[]
}

/** GET /positions returns a bare array of Eloquent models (Phase 2 shape). */
export interface Position {
  id: string
  department_id: string
  title: string
  description: string | null
  target_applicant_type: TargetApplicantType
  slots_available: number
  slots_filled: number
  status: PositionStatus
  application_deadline: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  criteria_count?: number
  applications_count?: number
  department?: DepartmentRef & { description?: string | null }
  creator?: { id: string; first_name: string; last_name: string } | null
  criteria?: Criterion[]
}

export interface ApplicantSummary {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  applicant_type: ApplicantType
  institution_email: string | null
  profile_completed: boolean
}

export interface ApplicationRow {
  id: string
  applicant: ApplicantSummary | null
  position: { id: string; title: string; department: DepartmentRef | null } | null
  hiring_round: HiringRoundRef | null
  status: ApplicationStatus
  total_wsm_score: string | number | null
  is_pool_member: boolean
  applied_at: string | null
  status_updated_at: string | null
}

export interface StatusHistoryEntry {
  id: string
  previous_status: ApplicationStatus | null
  new_status: ApplicationStatus
  notes?: string | null
  changed_by?: string | null
  changed_at: string | null
}

export interface ApplicationResponseRow {
  id: string
  criterion_id: string
  criterion: { id: string; name: string; type: CriterionDataType; weight: string | number } | null
  raw_value: string | null
  normalized_score: string | number | null
  weighted_score: string | number | null
  responded_at: string | null
}

export interface DocumentRow {
  id: string
  application_id?: string | null
  document_type: string
  file_name: string
  mime_type: string | null
  file_size_bytes: number | null
  is_verified: boolean
  uploaded_by?: string | null
  uploaded_at: string | null
  /** Who signed off on the credential, and when. Null until an admin verifies it. */
  verified_by?: string | null
  verified_at?: string | null
  download_url?: string
}

export interface ApplicationDetail extends ApplicationRow {
  summary: string | null
  parsed_resume_data: Record<string, unknown> | null
  account_created_at: string | null
  responses: ApplicationResponseRow[]
  documents: DocumentRow[]
  status_history: StatusHistoryEntry[]
}

export interface ActivityEntry {
  id: string
  application_id: string
  applicant_name: string | null
  position: string | null
  previous_status: ApplicationStatus | null
  new_status: ApplicationStatus
  changed_by: string | null
  timestamp: string | null
}

export interface DashboardStats {
  active_round: {
    id: string
    name: string
    semester: string
    academic_year: number
    start_date: string | null
    end_date: string | null
  } | null
  open_positions: number
  total_positions: number
  total_slots: number
  filled_slots: number
  total_applicants: number
  total_applications: number
  pending_reviews: number
  hired_count: number
  scored_count: number
  pool_members: number
  applications_by_status: Record<ApplicationStatus, number>
  recent_activity: ActivityEntry[]
}

/** Row from the v_applicant_rankings view. */
export interface RankingRow {
  application_id: string
  position_id: string
  applicant_name?: string
  first_name?: string
  last_name?: string
  email?: string
  applicant_type?: ApplicantType
  status: ApplicationStatus
  total_wsm_score: string | number | null
  rank_in_position: number
}

/** Row from the v_wsm_score_breakdown view. */
export interface ScoreBreakdownRow {
  criterion_name: string
  data_type?: CriterionDataType
  weight: string | number
  raw_value: string | null
  normalized_score: string | number | null
  weighted_score: string | number | null
}

export interface ScoreBreakdown {
  application_id: string
  total_wsm_score: string | number | null
  breakdown: ScoreBreakdownRow[]
}

export interface AssignmentRunSummary {
  id: string
  hiring_round: HiringRoundRef | null
  scope_applicant_type: ApplicantType | null
  status: 'pending' | 'completed' | 'failed'
  result_summary: {
    objective_score?: number
    assigned_count?: number
    candidate_count?: number
    error?: string
  } | null
  assigned_count: number
  run_by: string | null
  run_at: string | null
  completed_at: string | null
}

export interface AssignmentResultRow {
  id: string
  application_id: string
  position_id: string
  is_assigned: boolean
  objective_score: string | number | null
  application?: {
    id: string
    status: ApplicationStatus
    total_wsm_score: string | number | null
    applicant_profile?: {
      id: string
      applicant_type: ApplicantType
      user?: { id: string; first_name: string; last_name: string; email: string }
    }
  }
  position?: { id: string; title: string; department?: DepartmentRef }
}

export interface AssignmentRunDetail {
  id: string
  hiring_round_id: string
  hiring_round?: HiringRound
  scope_applicant_type: ApplicantType | null
  scope_position_ids: string[] | null
  scope_department_ids: string[] | null
  ilp_parameters: Record<string, unknown> | null
  status: 'pending' | 'completed' | 'failed'
  result_summary: AssignmentRunSummary['result_summary']
  run_at: string | null
  completed_at: string | null
  runner?: { id: string; first_name: string; last_name: string } | null
  results: AssignmentResultRow[]
}

export interface PoolEntry {
  id: string
  applicant: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    applicant_type: ApplicantType
    institution_email: string | null
  } | null
  position: { id: string; title: string; department: { id: string; name: string } | null } | null
  hiring_round: HiringRoundRef | null
  pool_status: 'active' | 'inactive' | 'reengaged' | 'expired'
  reengagement_email_sent: boolean
  reengagement_sent_at: string | null
  confirmed_interest: boolean | null
  responded_at: string | null
  created_at: string
}

export interface StaffAccount {
  id: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  role: 'admin' | 'director' | 'internal_applicant'
  account_status: 'active' | 'inactive'
  is_active: boolean
  has_temp_password: boolean
  email_verified_at: string | null
  created_at: string | null
}

export interface NotificationRow {
  id: string
  user_id: string
  application_id: string | null
  type: 'application_received' | 'status_change' | 'pool_invitation' | 'account_created' | 'reengagement'
  subject: string
  body: string
  channel: 'email' | 'in_app'
  delivery_status: 'pending' | 'sent' | 'failed'
  sent_at: string | null
  read_at: string | null
  created_at: string
}

export interface NotificationList {
  data: NotificationRow[]
  meta: { total: number; unread_count: number }
}

// ─── Applicant-facing ────────────────────────────────────────────────────────

export interface ApplicantPosition {
  id: string
  title: string
  description: string | null
  department: DepartmentRef | null
  target_applicant_type: TargetApplicantType
  slots_available: number
  slots_filled: number
  status: PositionStatus
  application_deadline: string | null
  criteria_count: number
  /** Submitted only — a draft leaves this false so the applicant can resume it. */
  has_applied: boolean
  application_status: ApplicationStatus | null
  application_id: string | null
}

export interface MyApplication {
  id: string
  position: {
    id: string
    title: string
    application_deadline: string | null
    department: DepartmentRef | null
  } | null
  hiring_round: HiringRoundRef | null
  status: ApplicationStatus
  documents_count: number
  applied_at: string | null
  status_updated_at: string | null
}

export interface MyApplicationDetail {
  id: string
  status: ApplicationStatus
  pipeline_position: number | null
  total_steps: number
  applied_at: string | null
  status_updated_at: string | null
  position: { id: string; title: string }
  hiring_round: { id: string; name: string }
  status_history: StatusHistoryEntry[]
}

/**
 * Structured resume data produced by the FastAPI parser and stored in
 * `applicant_profiles.parsed_resume_data`. Every field is best-effort: the parser
 * leaves anything it could not find null/empty rather than guessing, and the
 * applicant corrects it on the review step before continuing.
 */
export interface ParsedEducation {
  raw_text?: string
  degree: string | null
  field_of_study: string | null
  institution: string | null
  graduation_year: string | null
}

/** Work, teaching, and academic experience are unified into one section. */
export interface ParsedExperience {
  raw_text?: string
  position: string | null
  organization: string | null
  start_date: string | null
  end_date: string | null
  responsibilities: string[]
  courses_taught: string[]
}

/** Certifications and licenses share a single section. */
export interface ParsedCertification {
  raw_text?: string
  name: string | null
  issuer: string | null
  date_obtained: string | null
  expiration_date: string | null
}

/** Sections the parser only captures as a single line of text. */
export interface ParsedTextEntry {
  raw_text: string
}

export interface ParsedResume {
  name: string | null
  email: string | null
  phone: string | null
  address: string | null
  linkedin: string | null
  portfolio: string | null
  education: ParsedEducation[]
  experience: ParsedExperience[]
  certifications: ParsedCertification[]
  skills: string[]
  research_interests: string[]
  publications: ParsedTextEntry[]
  research_projects: ParsedTextEntry[]
  professional_development: ParsedTextEntry[]
  awards: ParsedTextEntry[]
}

export interface ApplicantProfile {
  id?: string
  user_id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string | null
  applicant_type: ApplicantType
  institution_email: string | null
  summary: string | null
  parsed_resume_data: Record<string, unknown> | null
  profile_completed_at: string | null
}

/** GET /positions/{id}/form — the criteria an applicant must answer. */
/**
 * A criterion as the applicant-facing form endpoint returns it: no weight or
 * display_order, and identified by `criterion_id` rather than `id`.
 */
export interface PositionFormFieldPayload {
  criterion_id?: string
  id?: string
  name: string
  description: string | null
  data_type: CriterionDataType
  is_required: boolean
  min_value: string | number | null
  max_value: string | number | null
  options?: CriterionOption[]
}

/** The same field after normalisation, keyed by `id` like every other model. */
export interface PositionFormField extends Omit<PositionFormFieldPayload, 'criterion_id' | 'id'> {
  id: string
}

export interface PositionForm {
  position?: { id: string; title: string; description?: string | null }
  fields?: PositionFormFieldPayload[]
  criteria?: PositionFormFieldPayload[]
}

export interface MyPoolStatus {
  id: string
  position_title: string | null
  hiring_round: { name: string; semester: string; academic_year: number } | null
  pool_status: string
  reengagement_email_sent: boolean
  confirmed_interest: boolean | null
  created_at: string
}
