# Faculty Multi-Criteria Decision Support System (MCDSS)
## Full System Description (Revised with Client Recommendations)

---

## 1. System Overview

The Faculty Multi-Criteria Decision Support System (MCDSS) is a web-based platform designed to assist higher education institutions in two core human resource workflows: **faculty hiring** and **teaching load allocation**. The system provides a structured, data-driven, and transparent approach to evaluating candidates and assigning faculty, grounded in configurable evaluation criteria, automated scoring through the Weighted Sum Model (WSM), and optimization through Integer Linear Programming (ILP).

The system supports both **external applicants** (individuals seeking employment at the institution) and **internal applicants** (existing faculty or staff applying for promotions, role changes, or internal hiring rounds). It is designed to be administered by HR personnel and academic directors, with role-appropriate interfaces for all user types, including a mobile-responsive view for applicants.

---

## 2. User Roles and Access

The system defines four primary user roles, each with distinct permissions and interfaces:

### 2.1 Administrator / HR Personnel
- Full access to all system modules
- Can configure evaluation criteria, weights, and constraints per position
- Can define and edit application forms for both external and internal applicants
- Can create temporary accounts for existing faculty/staff (see Section 5.2)
- Can view and manage all applicant information and documents in a table format
- Can manage hiring rounds, applicant pools, and status tracking
- Can trigger email notifications at each stage of the hiring process
- Can run scoring, ranking, and ILP-based assignment operations
- Can configure and edit the predefined internal staff application form

### 2.2 Academic Director
- Can view evaluation results, rankings, and assignment recommendations
- Can review applicant profiles and documents
- Can provide input into hiring and allocation decisions
- Access limited to their department or scope as configured by the administrator

### 2.3 External Applicant
- Registers independently through a public-facing portal
- Fills out the HR-predefined application form (with resume parser assistance)
- Uploads required documents (certificates, IDs, government forms, etc.)
- Applies to one or more open positions
- Can view their current application status through the hiring status tracker

### 2.4 Internal Applicant (Existing Faculty / Staff)
- Receives a temporary account created by HR/admin, linked to their institutional email
- Logs in for the first time and completes or edits their profile
- Fills out the separate, HR-predefined internal staff application form
- Uploads required documents
- Applies to one or more open positions (internal hiring or promotion)
- Can view their current application status through the hiring status tracker

> **Note:** An applicant may be either an external applicant or an internal applicant. Both types can apply to one or more positions, and both are subject to the ILP-based assignment model.

---

## 3. Position Management

Each open position is managed as a distinct entity within the system, with its own independently configurable evaluation criteria and application form.

### 3.1 Position Configuration
HR/admin can create and manage open positions with the following attributes:
- Position title and description
- Department or specialization
- Number of available slots
- Target applicant type (external only, internal only, or both)
- Position-specific evaluation criteria and corresponding weights (editable at any time)
- Status (open, closed, filled)

### 3.2 Per-Position Criteria and Weights
Unlike a single global evaluation framework, each open position has its own set of evaluation criteria independently defined and maintained by HR/admin. For example:
- A junior lecturer position might weight teaching experience heavily
- A research faculty position might weight publication output and academic rank more
- Criteria can include: educational attainment, teaching experience, research output, professional certifications, years of service, specialization alignment, and others as defined by the institution

Criteria and weights for any position can be modified by HR/admin without requiring code changes.

---

## 4. Application Forms

The system supports two types of predefined application forms, both editable by HR/admin.

### 4.1 External Applicant Form
- Defined and maintained by HR/admin
- Automatically generated based on the evaluation criteria configured for the position
- Ensures consistency between collected data and scoring metrics
- Supports resume parsing (see Section 4.3) to auto-fill fields
- Applicants review and complete any missing or unextracted information before final submission

### 4.2 Internal Staff Application Form
- A separate, distinct form designed specifically for existing faculty and staff
- Also predefined and editable by HR/admin
- May include fields related to current role, tenure, internal performance records, preferred load, availability, and other institution-specific attributes
- Presented to internal applicants upon login

### 4.3 Resume Parser (External Applicants)
- Upon initiating an application, external applicants can upload their resume or curriculum vitae
- The system automatically extracts relevant information (e.g., educational background, work experience, publications, certifications) and populates the corresponding form fields
- Applicants are presented with the auto-filled form for review, correction, and completion of any missing or unextracted information before submission
- Submission is only finalized once the applicant confirms the form is complete and accurate

---

## 5. Account and Identity Management

### 5.1 External Applicant Registration
- External applicants self-register through the public portal using their personal email address
- Account verification is handled via email confirmation

### 5.2 Internal Staff Account Creation
- HR/admin creates temporary accounts for existing faculty and staff by entering their institutional email addresses
- The system sends a welcome email with a temporary password or account activation link
- Upon first login, staff are prompted to update their credentials and complete their profile
- Staff can subsequently update their own information and upload supporting documents at any time

---

## 6. Document Repository

The system serves as a centralized repository for applicant information and supporting documents.

### 6.1 Supported Document Types
- Academic credentials and transcripts
- Professional certifications
- Government-issued identification forms
- Employment records and letters
- Research publications or portfolios
- Any other document types as specified by HR/admin

### 6.2 Document Management Features
- Applicants (both external and internal) upload documents directly through their portal
- Documents are associated with the applicant's profile and remain accessible across hiring rounds
- HR/admin can view, download, and manage all uploaded documents
- Documents are displayed alongside other applicant information in the HR/admin table view

---

## 7. Hiring Status Tracker

The system includes a transparent, real-time tracker for monitoring each applicant's progress through the hiring process.

### 7.1 Hiring Stages
The default hiring pipeline consists of the following sequential stages:

1. **Applied** — The applicant has successfully submitted their application
2. **For Interview** — The applicant has been shortlisted and scheduled for an interview
3. **For Review** — Post-interview evaluation is in progress
4. **Hired** — The applicant has been selected and offered the position

> This pipeline is defined for the initial deployment and is intended to be refined or extended as the institution's hiring process matures.

### 7.2 Visibility
- HR/admin can view and update the status of all applicants from the HR dashboard
- Each applicant can view their own current status from their applicant portal
- Status changes are logged with timestamps for audit purposes

---

## 8. Email Notifications

The system sends automated email notifications to applicants at key points in the hiring process.

### 8.1 Triggered Notifications
- Application received confirmation
- Status change notification (e.g., moved to "For Interview," "For Review," "Hired")
- Applicant pool invitation (see Section 9)
- Account creation notification (for internal staff with temporary accounts)

### 8.2 Email Testing
- During development and testing, **Mailhog** is used as a local SMTP testing server to capture and inspect outgoing emails without sending them to real addresses
- Production deployment will be configured to use the institution's email service provider

---

## 9. Applicant Pool Module

Universities typically conduct hiring rounds on a per-semester basis. Applicants who are not hired in a given round are not simply discarded — they are moved to a managed applicant pool for potential consideration in future rounds.

### 9.1 Pool Management
- At the close of each hiring round, HR/admin can designate unhired applicants as pool members
- The pool is viewable and searchable by HR/admin, with filtering by semester, position applied for, department, and applicant type

### 9.2 Pool Reactivation
- At the start of a new hiring round, HR/admin can review the applicant pool and identify candidates still relevant for open positions
- HR/admin can send a re-engagement email notification to selected pool members, informing them of new openings and asking if they wish to reapply or have their application considered for the new round
- Pool members who confirm their continued interest can be reintroduced into the active applicant pipeline for the new hiring round
- Pool members who do not respond within a configurable period can be marked as inactive

---

## 10. Evaluation and Scoring

### 10.1 Weighted Sum Model (WSM)
Each applicant (external or internal) is evaluated using a Weighted Sum Model applied to the criteria configured for the position they applied to:

**Score = Σ (Weight_i × NormalizedScore_i)**

Where each criterion i has a defined weight and the applicant's raw value is normalized to a consistent scale before aggregation.

### 10.2 Score Breakdown and Transparency
- The system displays a full breakdown of each applicant's score per criterion
- HR/admin and academic directors can see exactly how the final score was computed
- This supports explainability and defensibility of hiring recommendations

### 10.3 Ranking
Applicants are ranked by their WSM score per position. HR/admin can view ranked lists with score breakdowns.

---

## 11. Assignment (formerly "Optimization")

> **Label Change:** The "Optimization" module has been renamed to **"Assignment"** throughout the system to better reflect its purpose and improve clarity for end users.

### 11.1 ILP-Based Candidate Selection (Hiring)
For positions with multiple applicants, the system applies Integer Linear Programming (ILP) to determine the optimal selection of candidates. This is applicable when one or more applicants have applied to a given position.

The ILP model:
- Maximizes total WSM score of selected candidates across positions
- Satisfies constraints including: number of available slots per position, departmental requirements, and institutional policies
- Accounts for cases where a single applicant has applied to multiple positions (ensuring assignment to at most one)

### 11.2 ILP-Based Faculty Allocation (Internal)
For workload allocation among existing faculty, the ILP model:
- Assigns faculty members to courses or roles
- Respects constraints including: maximum teaching load per faculty member, subject expertise and qualifications, and departmental requirements
- Maximizes alignment between faculty expertise and assigned responsibilities

### 11.3 Assignment Constraints and Filters
HR/admin can configure constraints on which applicants are included in a given assignment run:
- **Applicant type:** Internal applicants only, external applicants only, or both
- **Department:** Restrict the pool to applicants for specific departments
- **Position:** Run assignment for selected positions or all open positions
- **Custom constraints:** Additional constraints as defined by the institution

### 11.4 Applicability
ILP is applied when at least one applicant has applied to one or more positions. Both internal and external applicants are eligible for ILP-based assignment.

---

## 12. HR/Admin Dashboard — Applicant Table View

HR/admin users access applicant information through a **table-based interface** (not a card layout), allowing efficient review and comparison of large numbers of applicants.

### 12.1 Table Features
- Sortable and filterable columns (by name, position applied, score, status, department, applicant type, application date, etc.)
- Inline status update controls
- Quick-access links to each applicant's full profile and document repository
- Export to CSV or printable format
- Separate table views for external applicants and internal staff

---

## 13. Applicant Portal

The applicant-facing interface is designed for ease of use and accessibility.

### 13.1 Features
- Application form with resume parser assistance (external applicants)
- Internal staff form (for existing faculty/staff)
- Document upload and management
- Application status tracker
- Ability to apply to multiple open positions
- Notifications inbox (linked to email notifications)

### 13.2 Mobile Version
The applicant portal is fully responsive and supports a dedicated **mobile view**, ensuring accessibility for applicants who primarily use smartphones or tablets.

---

## 14. System Architecture Summary

| Layer | Description |
|---|---|
| Frontend | Role-based web interfaces; responsive/mobile-ready applicant portal |
| Backend | REST API handling authentication, form logic, scoring, ILP, notifications |
| Database | Relational database storing users, positions, criteria, applications, documents, scores |
| Email Service | Mailhog (testing); configurable SMTP for production |
| Optimization Engine | ILP solver integrated into the Assignment module |
| Document Storage | Secure file storage for applicant-uploaded documents |

---

## 15. Key System Principles

**Configurability** — Criteria, weights, forms, and constraints are all configurable by HR/admin without code changes.

**Transparency** — Scores, rankings, and assignment decisions include full breakdowns accessible to authorized users.

**Role Separation** — Each user role sees only the interfaces and data appropriate to their function.

**Auditability** — Status changes, scoring runs, and assignment decisions are logged with timestamps.

**Scalability** — The system is designed to support multiple departments, hiring rounds, and concurrent positions.

**Accessibility** — The applicant portal supports both desktop and mobile devices to maximize participation.
