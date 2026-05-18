// Mock data for the applicant portal (signed in as Juan dela Cruz, external applicant)

export const currentUser = {
  id: 'user-001',
  firstName: 'Juan',
  lastName: 'dela Cruz',
  fullName: 'Juan dela Cruz',
  email: 'juan.delacruz@email.com',
  institutionEmail: null as string | null,
  phone: '+63 917 123 4567',
  type: 'external' as 'external' | 'internal',
  isFirstLogin: false,
  isTempPassword: false,
}

// ─── Open Positions ──────────────────────────────────────────────────────────
export const openPositions = [
  {
    id: 'pos-001',
    title: 'Assistant Professor I',
    department: 'Department of Information Technology',
    departmentCode: 'DIT',
    targetType: 'both',
    slotsAvailable: 2,
    slotsFilled: 0,
    deadline: '2025-07-31',
    description:
      'Seeking a qualified Assistant Professor I to teach undergraduate IT courses, engage in research, and contribute to departmental activities.',
  },
  {
    id: 'pos-002',
    title: 'Instructor III',
    department: 'College of Engineering',
    departmentCode: 'COE',
    targetType: 'external',
    slotsAvailable: 3,
    slotsFilled: 1,
    deadline: '2025-08-15',
    description:
      'The College of Engineering invites applications for three Instructor III positions in mechanical, electrical, and civil engineering disciplines.',
  },
  {
    id: 'pos-005',
    title: 'Instructor I',
    department: 'Department of Natural Sciences',
    departmentCode: 'DNS',
    targetType: 'external',
    slotsAvailable: 2,
    slotsFilled: 0,
    deadline: '2025-07-15',
    description:
      'Position for laboratory and lecture courses in Biology, Chemistry, and Physics.',
  },
  {
    id: 'pos-006',
    title: 'Assistant Professor III',
    department: 'College of Engineering',
    departmentCode: 'COE',
    targetType: 'both',
    slotsAvailable: 1,
    slotsFilled: 0,
    deadline: '2025-08-01',
    description:
      'Doctorate-level position in engineering with an active research agenda. Open to both external and internal applicants.',
  },
  {
    id: 'pos-007',
    title: 'Instructor II',
    department: 'Department of Information Technology',
    departmentCode: 'DIT',
    targetType: 'external',
    slotsAvailable: 2,
    slotsFilled: 0,
    deadline: '2025-08-10',
    description:
      'Two Instructor II positions for laboratory and lecture courses in Programming, Networking, and Web Development.',
  },
]

// ─── My Applications (Juan dela Cruz) ────────────────────────────────────────
export const myApplications = [
  {
    id: 'app-001',
    positionId: 'pos-001',
    positionTitle: 'Assistant Professor I',
    department: 'Department of Information Technology',
    hiringRound: 'AY 2025-2026 First Semester',
    status: 'for_interview' as const,
    lastUpdated: '2025-05-17T10:30:00',
    appliedAt: '2025-05-15T14:22:00',
  },
  {
    id: 'app-007',
    positionId: 'pos-002',
    positionTitle: 'Instructor III',
    department: 'College of Engineering',
    hiringRound: 'AY 2025-2026 First Semester',
    status: 'applied' as const,
    lastUpdated: '2025-05-14T10:05:00',
    appliedAt: '2025-05-14T10:00:00',
  },
]

// ─── Form Responses (for app-001 — Assistant Professor I) ────────────────────
export const formResponses = [
  {
    criterion: 'Educational Attainment',
    answer: 'PhD Units (4)',
    dataType: 'numeric',
  },
  {
    criterion: 'Teaching Experience (years)',
    answer: '6 years',
    dataType: 'numeric',
  },
  {
    criterion: 'Research Publications',
    answer: '5 peer-reviewed publications',
    dataType: 'numeric',
  },
  {
    criterion: 'Professional Certifications',
    answer: 'Yes — PRC License, ITIL Foundation',
    dataType: 'boolean',
  },
  {
    criterion: 'Specialization Alignment',
    answer: 'High (Software Engineering, Information Systems)',
    dataType: 'select',
  },
]

// ─── My Documents ────────────────────────────────────────────────────────────
export const myDocuments = [
  {
    id: 'doc-001',
    documentType: 'Transcript of Records',
    fileName: 'delacruz_tor.pdf',
    fileSize: '1.2 MB',
    verified: 'verified',
    uploadedAt: '2025-05-15T14:30:00',
  },
  {
    id: 'doc-002',
    documentType: 'Curriculum Vitae',
    fileName: 'delacruz_cv.pdf',
    fileSize: '856 KB',
    verified: 'verified',
    uploadedAt: '2025-05-15T14:32:00',
  },
  {
    id: 'doc-003',
    documentType: 'Board Certificate / PRC License',
    fileName: 'delacruz_prc.pdf',
    fileSize: '420 KB',
    verified: 'unverified',
    uploadedAt: '2025-05-15T14:35:00',
  },
  {
    id: 'doc-004',
    documentType: 'Service Record',
    fileName: 'delacruz_service_record.pdf',
    fileSize: '640 KB',
    verified: 'verified',
    uploadedAt: '2025-05-15T14:38:00',
  },
  {
    id: 'doc-005',
    documentType: 'Government ID',
    fileName: 'delacruz_passport.pdf',
    fileSize: '210 KB',
    verified: 'verified',
    uploadedAt: '2025-05-15T14:40:00',
  },
]

// ─── Notifications ───────────────────────────────────────────────────────────
export const myNotifications = [
  {
    id: 'notif-001',
    type: 'status_change',
    subject: 'Your application status has been updated to For Interview',
    bodyPreview:
      'Dear Juan, your application for Assistant Professor I (DIT) has been updated to For Interview. Please await further instructions.',
    sentAt: '2025-05-17T10:31:00',
    read: false,
  },
  {
    id: 'notif-002',
    type: 'application_received',
    subject: 'Application Received — Assistant Professor I',
    bodyPreview:
      'We have received your application for Assistant Professor I at the Department of Information Technology.',
    sentAt: '2025-05-15T14:23:00',
    read: false,
  },
  {
    id: 'notif-003',
    type: 'application_received',
    subject: 'Application Received — Instructor III',
    bodyPreview:
      'We have received your application for Instructor III at the College of Engineering.',
    sentAt: '2025-05-14T10:05:00',
    read: true,
  },
  {
    id: 'notif-004',
    type: 'account_created',
    subject: 'Welcome to MCDSS',
    bodyPreview:
      'Welcome to the Faculty Multi-Criteria Decision Support System. Your account has been successfully created.',
    sentAt: '2025-05-14T09:00:00',
    read: true,
  },
  {
    id: 'notif-005',
    type: 'pool_invitation',
    subject: 'New positions available — Continue your candidacy',
    bodyPreview:
      'Open positions matching your profile are available in the new hiring round. Confirm your continued interest.',
    sentAt: '2025-05-10T08:15:00',
    read: true,
  },
]

// ─── Position Criteria (for Apply form, pos-001) ─────────────────────────────
export const positionCriteria = [
  {
    id: 'crit-001',
    name: 'Educational Attainment',
    description: 'Level of educational attainment (1=Bachelor, 2=PG Units, 3=Master, 4=PhD Units, 5=Doctorate)',
    dataType: 'numeric' as const,
    required: true,
    minValue: 1,
    maxValue: 5,
  },
  {
    id: 'crit-002',
    name: 'Teaching Experience (years)',
    description: 'Number of years of teaching experience in higher education',
    dataType: 'numeric' as const,
    required: true,
    minValue: 0,
    maxValue: 20,
  },
  {
    id: 'crit-003',
    name: 'Research Publications',
    description: 'Number of peer-reviewed publications in the past 5 years',
    dataType: 'numeric' as const,
    required: false,
    minValue: 0,
    maxValue: 10,
  },
  {
    id: 'crit-004',
    name: 'Professional Certifications',
    description: 'Holds relevant professional certifications (e.g., PRC license, industry certifications)',
    dataType: 'boolean' as const,
    required: false,
  },
  {
    id: 'crit-005',
    name: 'Specialization Alignment',
    description: 'How well your specialization aligns with the position',
    dataType: 'select' as const,
    required: true,
    options: ['High', 'Medium', 'Low'],
  },
  {
    id: 'crit-006',
    name: 'Areas of Expertise',
    description: 'Brief description of your primary areas of expertise',
    dataType: 'text' as const,
    required: false,
  },
]

// ─── Notification type labels ────────────────────────────────────────────────
export const notificationTypeLabel: Record<string, string> = {
  status_change: 'Status Update',
  application_received: 'Application Received',
  account_created: 'Account Created',
  pool_invitation: 'Pool Invitation',
  reengagement: 'Re-engagement',
}
