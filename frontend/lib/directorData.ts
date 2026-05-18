// Director scope: Department of Information Technology (DIT)
// All data here is scoped to the DIT department.

export const directorInfo = {
  name: 'Prof. Maria Reyes',
  email: 'maria.reyes@university.edu.ph',
  department: 'DIT',
  departmentName: 'Department of Information Technology',
  departmentCode: 'DIT',
}

// ─── Positions (DIT only) ─────────────────────────────────────────────────────
export const positions = [
  {
    id: 'pos-001',
    title: 'Assistant Professor I',
    department: 'DIT',
    departmentName: 'Department of Information Technology',
    status: 'open',
    slotsAvailable: 2,
    slotsFilled: 1,
    targetType: 'both',
    deadline: '2025-07-31',
    createdAt: '2025-05-01',
    description:
      'We are seeking a qualified Assistant Professor I to join the Department of Information Technology. The successful candidate will teach undergraduate IT courses, engage in research, and contribute to departmental activities.',
    hiringRound: 'AY 2025-2026 First Semester',
  },
  {
    id: 'pos-007',
    title: 'Instructor II',
    department: 'DIT',
    departmentName: 'Department of Information Technology',
    status: 'open',
    slotsAvailable: 2,
    slotsFilled: 0,
    targetType: 'external',
    deadline: '2025-08-10',
    createdAt: '2025-05-05',
    description:
      'The Department of Information Technology is seeking two Instructor II positions for laboratory and lecture courses in Programming, Networking, and Web Development.',
    hiringRound: 'AY 2025-2026 First Semester',
  },
  {
    id: 'pos-008',
    title: 'Associate Professor I',
    department: 'DIT',
    departmentName: 'Department of Information Technology',
    status: 'closed',
    slotsAvailable: 1,
    slotsFilled: 1,
    targetType: 'internal',
    deadline: '2025-03-15',
    createdAt: '2025-01-20',
    description:
      'Internal promotion track for an Associate Professor I position. This position has been filled.',
    hiringRound: 'AY 2024-2025 Second Semester',
  },
]

// ─── Criteria ─────────────────────────────────────────────────────────────────
export const criteriaByPosition: Record<string, typeof criteriaList> = {
  'pos-001': [],
}

export const criteriaList = [
  {
    id: 'crit-001',
    name: 'Educational Attainment',
    dataType: 'numeric',
    weight: 0.30,
    required: true,
    minValue: 1,
    maxValue: 5,
  },
  {
    id: 'crit-002',
    name: 'Teaching Experience (years)',
    dataType: 'numeric',
    weight: 0.25,
    required: true,
    minValue: 0,
    maxValue: 20,
  },
  {
    id: 'crit-003',
    name: 'Research Publications',
    dataType: 'numeric',
    weight: 0.20,
    required: false,
    minValue: 0,
    maxValue: 10,
  },
  {
    id: 'crit-004',
    name: 'Professional Certifications',
    dataType: 'boolean',
    weight: 0.15,
    required: false,
    minValue: null,
    maxValue: null,
  },
  {
    id: 'crit-005',
    name: 'Specialization Alignment',
    dataType: 'select',
    weight: 0.10,
    required: true,
    minValue: null,
    maxValue: null,
  },
]

// ─── Applicants (DIT only) ────────────────────────────────────────────────────
export const applicants = [
  {
    id: 'app-001',
    firstName: 'Juan',
    lastName: 'dela Cruz',
    fullName: 'Juan dela Cruz',
    email: 'juan.delacruz@email.com',
    phone: '+63 917 123 4567',
    type: 'external',
    positionId: 'pos-001',
    positionTitle: 'Assistant Professor I',
    wsmScore: 0.8742,
    status: 'for_interview',
    appliedDate: '2025-05-15',
    accountCreated: '2025-05-14',
    profileCompleted: true,
    summary:
      'Master of Science in Information Technology graduate with 6 years of teaching experience and 5 peer-reviewed publications.',
  },
  {
    id: 'app-002',
    firstName: 'Maria',
    lastName: 'Santos',
    fullName: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '+63 918 234 5678',
    type: 'external',
    positionId: 'pos-001',
    positionTitle: 'Assistant Professor I',
    wsmScore: 0.7651,
    status: 'applied',
    appliedDate: '2025-05-17',
    accountCreated: '2025-05-16',
    profileCompleted: true,
    summary:
      'BS Computer Science graduate with 4 years of industry experience and recent transition to academia.',
  },
  {
    id: 'app-005',
    firstName: 'Miguel',
    lastName: 'Torres',
    fullName: 'Miguel Torres',
    email: 'miguel.torres@university.edu.ph',
    phone: '+63 921 567 8901',
    type: 'internal',
    positionId: 'pos-001',
    positionTitle: 'Assistant Professor I',
    wsmScore: 0.8891,
    status: 'for_interview',
    appliedDate: '2025-05-08',
    accountCreated: '2025-03-15',
    profileCompleted: true,
    summary:
      'Internal applicant — current Instructor III with 8 years of service. Holds Master in IT and active research portfolio.',
  },
  {
    id: 'app-009',
    firstName: 'Elena',
    lastName: 'Garcia',
    fullName: 'Elena Garcia',
    email: 'elena.garcia@email.com',
    phone: '+63 925 678 0123',
    type: 'external',
    positionId: 'pos-007',
    positionTitle: 'Instructor II',
    wsmScore: 0.7234,
    status: 'applied',
    appliedDate: '2025-05-12',
    accountCreated: '2025-05-11',
    profileCompleted: true,
    summary:
      'Recent graduate of MS Computer Science with 2 years industry experience as a software developer.',
  },
  {
    id: 'app-010',
    firstName: 'Antonio',
    lastName: 'Bautista',
    fullName: 'Antonio Bautista',
    email: 'antonio.bautista@email.com',
    phone: '+63 926 789 0234',
    type: 'external',
    positionId: 'pos-007',
    positionTitle: 'Instructor II',
    wsmScore: 0.6987,
    status: 'for_review',
    appliedDate: '2025-05-13',
    accountCreated: '2025-05-12',
    profileCompleted: true,
    summary:
      'PhD candidate in Computer Engineering with experience teaching at the secondary level.',
  },
]

// ─── Score Breakdown (for app-001) ────────────────────────────────────────────
export const scoreBreakdown = [
  {
    criterionName: 'Educational Attainment',
    weight: 0.30,
    rawValue: '4',
    normalizedScore: 0.75,
    weightedScore: 0.2250,
  },
  {
    criterionName: 'Teaching Experience (years)',
    weight: 0.25,
    rawValue: '6',
    normalizedScore: 0.30,
    weightedScore: 0.0750,
  },
  {
    criterionName: 'Research Publications',
    weight: 0.20,
    rawValue: '5',
    normalizedScore: 0.50,
    weightedScore: 0.1000,
  },
  {
    criterionName: 'Professional Certifications',
    weight: 0.15,
    rawValue: 'Yes',
    normalizedScore: 1.00,
    weightedScore: 0.1500,
  },
  {
    criterionName: 'Specialization Alignment',
    weight: 0.10,
    rawValue: 'High',
    normalizedScore: 0.9467,
    weightedScore: 0.0947,
  },
]

// ─── Documents (for app-001) ──────────────────────────────────────────────────
export const applicantDocuments = [
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
]

// ─── Recent Activity (DIT only) ───────────────────────────────────────────────
export const recentActivity = [
  {
    id: 'act-001',
    applicantName: 'Juan dela Cruz',
    position: 'Assistant Professor I',
    previousStatus: 'applied',
    newStatus: 'for_interview',
    timestamp: '2025-05-17T10:30:00',
  },
  {
    id: 'act-002',
    applicantName: 'Maria Santos',
    position: 'Assistant Professor I',
    previousStatus: null,
    newStatus: 'applied',
    timestamp: '2025-05-17T08:45:00',
  },
  {
    id: 'act-003',
    applicantName: 'Antonio Bautista',
    position: 'Instructor II',
    previousStatus: 'applied',
    newStatus: 'for_review',
    timestamp: '2025-05-15T14:00:00',
  },
  {
    id: 'act-004',
    applicantName: 'Miguel Torres',
    position: 'Assistant Professor I',
    previousStatus: 'applied',
    newStatus: 'for_interview',
    timestamp: '2025-05-14T16:20:00',
  },
  {
    id: 'act-005',
    applicantName: 'Elena Garcia',
    position: 'Instructor II',
    previousStatus: null,
    newStatus: 'applied',
    timestamp: '2025-05-12T11:15:00',
  },
]

// ─── Assignment Results (DIT only) ────────────────────────────────────────────
export const assignmentRun = {
  id: 'arun-001',
  runAt: '2025-05-16T08:00:00',
  status: 'completed',
  objectiveScore: 2.5269,
  totalAssigned: 3,
  positionsFullyFilled: 1,
}

export const assignmentResults = [
  {
    id: 'ar-001',
    applicantName: 'Juan dela Cruz',
    position: 'Assistant Professor I',
    type: 'external',
    wsmScore: 0.8742,
    isAssigned: true,
    objectiveScore: 0.8742,
  },
  {
    id: 'ar-002',
    applicantName: 'Miguel Torres',
    position: 'Assistant Professor I',
    type: 'internal',
    wsmScore: 0.8891,
    isAssigned: true,
    objectiveScore: 0.8891,
  },
  {
    id: 'ar-007',
    applicantName: 'Maria Santos',
    position: 'Assistant Professor I',
    type: 'external',
    wsmScore: 0.7651,
    isAssigned: false,
    objectiveScore: 0.7651,
  },
  {
    id: 'ar-009',
    applicantName: 'Elena Garcia',
    position: 'Instructor II',
    type: 'external',
    wsmScore: 0.7234,
    isAssigned: true,
    objectiveScore: 0.7234,
  },
  {
    id: 'ar-010',
    applicantName: 'Antonio Bautista',
    position: 'Instructor II',
    type: 'external',
    wsmScore: 0.6987,
    isAssigned: false,
    objectiveScore: 0.6987,
  },
]

// ─── Faculty Workload (DIT only) ──────────────────────────────────────────────
export const facultyWorkload = [
  {
    id: 'fw-001',
    facultyName: 'Prof. Maria Santos',
    courseCode: 'IT301',
    courseName: 'Web Development',
    units: 3,
    semester: '1st Semester',
    academicYear: '2025-2026',
  },
  {
    id: 'fw-002',
    facultyName: 'Prof. Miguel Torres',
    courseCode: 'IT401',
    courseName: 'Database Systems',
    units: 3,
    semester: '1st Semester',
    academicYear: '2025-2026',
  },
  {
    id: 'fw-003',
    facultyName: 'Juan dela Cruz',
    courseCode: 'IT101',
    courseName: 'Introduction to Computing',
    units: 3,
    semester: '1st Semester',
    academicYear: '2025-2026',
  },
  {
    id: 'fw-004',
    facultyName: 'Juan dela Cruz',
    courseCode: 'IT201',
    courseName: 'Programming Fundamentals',
    units: 3,
    semester: '1st Semester',
    academicYear: '2025-2026',
  },
]
