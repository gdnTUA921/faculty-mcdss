# MCDSS Team Development Plan

---

## Team Legend

> **Edit this section to assign real names to labels before distributing.**

| Label    | Name         | Primary Role                          |
|----------|--------------|---------------------------------------|
| Person 1 | Gian         | Project Lead / Laravel Backend        |
| Person 2 | Peter        | Laravel Backend                       |
| Person 3 | Lance        | Laravel Backend                       |
| Person 4 | JB           | Python / FastAPI (Resume Parser + ILP) |

---

## Tech Stack Reference

| Layer             | Technology                        | Owner(s)             |
|-------------------|-----------------------------------|----------------------|
| Main Backend      | Laravel (PHP)                     | Person 1, 2, 3       |
| Compute Service   | Python + FastAPI                  | Person 4             |
| Database          | PostgreSQL                        | All (shared schema)  |
| Frontend          | Next.js (already built)           | All (integration)    |
| Email (dev)       | Mailhog (local SMTP capture)      | Person 1             |
| Email (prod)      | Configurable SMTP provider        | Person 1             |
| File Storage      | Local disk (dev) → configurable   | Person 3             |
| Containerization  | Docker + Docker Compose           | Person 1             |

---

## Build Waves Overview

Phases are grouped into **waves** — work within a wave can run in parallel; the next wave cannot start until all tasks in the current wave are done.

```
Wave 1  ──► Phase 1: Foundation                         [Person 1 + 2]
Wave 2  ──► Phase 2: Position Config      [Person 2]
         └► Phase 3: Accounts & Reg       [Person 3]    (parallel)
         └► FastAPI Project Setup         [Person 4]    (parallel)
Wave 3  ──► Phase 4: Application Forms & Submission     [Person 1 + 2 + 3 + 4]
Wave 4  ──► Phase 5: Hiring Status Tracker  [Person 3]
         └► Phase 6: Scoring & Ranking      [Person 2]  (parallel)
Wave 5  ──► Phase 7: Assignment / ILP       [Person 4]
         └► Phase 8: Applicant Pool         [Person 3]  (parallel)
Wave 6  ──► Phase 9: Notifications                      [Person 1]
Wave 7  ──► Phase 10: Dashboard Polish & Frontend Wire  [All]
```

---

## Phase 1 — Foundation

**Wave:** 1 | **Assigned to: Person 1 + Person 2**

---

### Person 1 — Container Setup (Docker)

This must be completed first so every teammate has a working local environment before writing any application code.

#### Deliverables
- `docker-compose.yml` in the project root defining the following services:

  | Service    | Image                  | Port (host → container) | Purpose                        |
  |------------|------------------------|-------------------------|--------------------------------|
  | `postgres`  | `postgres:16-alpine`   | `5432 → 5432`           | Shared PostgreSQL database      |
  | `laravel`   | Custom `Dockerfile`    | `8000 → 80`             | Laravel API (PHP-FPM + Nginx)   |
  | `fastapi`   | Custom `Dockerfile`    | `8001 → 8001`           | Python FastAPI compute service  |
  | `mailhog`   | `mailhog/mailhog`      | `1025 → 1025` (SMTP) / `8025 → 8025` (Web UI) | Local email capture |

- `backend-laravel/Dockerfile` — PHP 8.3-FPM image with Composer, required PHP extensions (`pdo_pgsql`, `mbstring`, `xml`, `bcmath`)
- `backend-py/Dockerfile` — Python 3.12-slim image with pip install from `requirements.txt`
- Named Docker volume `postgres_data` for database persistence across restarts
- Single Docker bridge network (`mcdss_network`) so all services resolve each other by service name
- `.env.example` at project root documenting all required environment variables:
  ```
  # PostgreSQL
  DB_HOST=postgres
  DB_PORT=5432
  DB_DATABASE=mcdss
  DB_USERNAME=mcdss_user
  DB_PASSWORD=secret

  # Laravel
  APP_URL=http://localhost:8000
  SANCTUM_STATEFUL_DOMAINS=localhost:3000

  # FastAPI internal auth
  FASTAPI_URL=http://fastapi:8001
  FASTAPI_SECRET_KEY=changeme

  # Mailhog
  MAIL_HOST=mailhog
  MAIL_PORT=1025
  MAIL_MAILER=smtp

  # Next.js (frontend)
  NEXT_PUBLIC_API_URL=http://localhost:8000/api
  ```
- `README` entry (or `RUN.md` update) with one-liner quickstart:
  ```bash
  cp .env.example .env
  docker compose up -d
  docker compose exec laravel php artisan migrate --seed
  ```
- Verify all 4 containers start cleanly and can reach each other before handing off to the team

#### Notes
- The `fastapi` container can start as a placeholder (`/health` only) until Person 4 completes their Wave 2 setup — the container definition must still exist in `compose.yml` from day one
- macOS users: use volume mounts with `delegated` or `cached` consistency flags to reduce filesystem overhead
- All teammates run `docker compose up -d` to start — no local PHP, Python, or PostgreSQL installs required

---

### Person 1 — Laravel Scaffolding and Auth

#### Deliverables
- Laravel project scaffolded inside `backend-laravel/` with PostgreSQL connection confirmed
- Authentication using Laravel Sanctum (token-based for SPA/API)
- Role guard middleware enforcing `admin`, `director`, `external_applicant`, `internal_applicant`
- Protected route groups per role (four separate route files or middleware groups)

---

### Person 2 — Migrations and Seeders

#### Deliverables
- Laravel migrations mirroring `database/MCDSS_Database.sql` (so the team uses `php artisan migrate`, not raw SQL)
- `users` and `departments` seeder with at least one account per role for local testing
- Confirm `php artisan migrate --seed` runs cleanly inside the `laravel` container

---

### Key Tables
`users` · `departments`

### Notes
- Person 1 completes Docker setup first — no one else can start until containers are running
- Do not proceed to Wave 2 until login, role detection, and route guards are working end-to-end inside Docker
- All API testing in this project should be done against `http://localhost:8000` (Laravel container), not a local PHP server

---

## Phase 2 — Position Configuration

**Wave:** 2 | **Assigned to: Person 2**

### Deliverables
- CRUD API for `positions` (create, list, show, update, open/close/fill)
- CRUD API for `criteria` per position (add, edit, reorder, delete)
- API for `criterion_options` (for `select`-type criteria)
- Enforce: criteria weights per position must sum to 1.0 (validated in the API layer)
- Admin-only access enforced via role middleware

### Key Tables
`positions` · `criteria` · `criterion_options`

### API Endpoints (suggested)
```
GET    /api/positions
POST   /api/positions
GET    /api/positions/{id}
PUT    /api/positions/{id}
PATCH  /api/positions/{id}/status

GET    /api/positions/{id}/criteria
POST   /api/positions/{id}/criteria
PUT    /api/criteria/{id}
DELETE /api/criteria/{id}

GET    /api/criteria/{id}/options
POST   /api/criteria/{id}/options
PUT    /api/criterion-options/{id}
DELETE /api/criterion-options/{id}
```

### Notes
- This phase unblocks Phase 4 (forms depend on criteria) and Phase 6 (scoring depends on weights)
- Do not hardcode any criteria — everything must be configurable through the API

---

## Phase 3 — Account and Registration Flows

**Wave:** 2 | **Assigned to: Person 3**

### Deliverables
- External applicant self-registration endpoint (`POST /api/register`)
- Email verification flow (token sent via Mailhog during development)
- `applicant_profiles` record auto-created on registration
- Admin endpoint to create internal staff accounts (`POST /api/admin/staff-accounts`)
  - Generates temp password, sets `is_temp_password = true`
  - Sends account creation email via Mailhog
- Forced password reset on first login when `is_temp_password = true`
- Profile completion endpoint for internal applicants (`PUT /api/applicant/profile`)
- `profile_completed_at` timestamp written on first profile save

### Key Tables
`users` · `applicant_profiles`

### API Endpoints (suggested)
```
POST   /api/register
POST   /api/email/verify/{token}
POST   /api/admin/staff-accounts
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/applicant/profile
PUT    /api/applicant/profile
POST   /api/auth/change-password
```

### Notes
- Mailhog must be running locally before testing email flows
- This phase runs in parallel with Phase 2 — no dependency between them
- Phase 4 cannot start until this and Phase 2 are both complete

---

## FastAPI Project Setup

**Wave:** 2 | **Assigned to: Person 4**

### Deliverables
- FastAPI project scaffolded in `backend-py/` (the Docker container for this already exists from Phase 1 — Person 4 fills in the application code)
- `backend-py/main.py` with a working `/health` endpoint returning `{ "status": "ok" }`
- `backend-py/requirements.txt` with initial dependencies:
  ```
  fastapi
  uvicorn[standard]
  pydantic
  pulp
  python-multipart
  spacy
  psycopg2-binary
  python-dotenv
  ```
- Read-only PostgreSQL connection configured via `.env` (for ILP to query scores directly from DB)
- Validate incoming requests carry the `X-Service-Key` header matching `FASTAPI_SECRET_KEY` in `.env`
- Confirm `docker compose exec fastapi curl http://localhost:8001/health` returns 200 before proceeding

### Notes
- The Docker service definition is already in `compose.yml` from Phase 1 — Person 4 does not need to touch Docker configuration
- Person 4 should agree with Person 1 on the internal API contract (request/response shapes) before Phase 4 begins
- The FastAPI service is called by Laravel via the internal Docker network (`http://fastapi:8001`) — it is never exposed directly to the frontend

---

## Phase 4 — Application Forms and Submission

**Wave:** 3 | **Assigned to: Person 1 + Person 2 + Person 3 + Person 4**

This is the largest phase. It is split by responsibility.

### Person 1 — Application submission and draft handling (Laravel)
- `POST /api/applications` — create a draft application (`status = 'draft'`)
- `PUT /api/applications/{id}` — save form responses (upsert into `application_form_responses`)
- `POST /api/applications/{id}/submit` — finalize, change status to `'applied'`, write `applied_at`
- Enforce: applicant cannot submit to the same position twice in the same round
- Enforce: only submit if position `status = 'open'` and `target_applicant_type` matches applicant type

### Person 2 — Form definition API (Laravel)
- `GET /api/positions/{id}/form` — returns criteria (with options for select-type) structured as form fields
- Internal vs external applicant variant handled by `target_applicant_type`
- `GET /api/applications/{id}/responses` — returns saved form responses for draft resumption

### Person 3 — Document upload (Laravel)
- `POST /api/documents` — upload a file, store on disk, create `documents` record
- `GET /api/documents` — list documents for the authenticated applicant
- `DELETE /api/documents/{id}` — soft or hard delete
- Associate document with an application via `application_id` (optional)
- Enforce: file type and size limits (configurable via `.env`)

### Person 4 — Resume parser endpoint (FastAPI)
- `POST /parse-resume` — accept multipart file upload (PDF or DOCX)
- Extract: name, email, phone, education, work experience, certifications, publications
- Return structured JSON matching the shape expected by `applicant_profiles.parsed_resume_data`
- Laravel calls this endpoint and writes the result to `parsed_resume_data` on the profile
- Implement with spaCy or equivalent; accuracy over speed

### Key Tables
`applications` · `application_form_responses` · `documents` · `applicant_profiles`

### Notes
- Do not begin this phase until Phases 2 and 3 are validated
- Person 4's resume parser can be tested independently using Postman before Laravel integration
- Draft applications must not appear in the HR dashboard ranking views (filter `status != 'draft'`)

---

## Phase 5 — Hiring Status Tracker

**Wave:** 4 | **Assigned to: Person 3**

### Deliverables
- `PATCH /api/applications/{id}/status` — HR-only endpoint to advance application status
- Valid transitions: `applied → for_interview → for_review → hired` (also `rejected`, `withdrawn` from any active state)
- Every status change inserts a row into `status_history` (never update, only insert)
- `GET /api/applications/{id}/status-history` — returns full audit trail
- Applicant-facing endpoint: `GET /api/applicant/applications/{id}` — returns current status and pipeline position

### Key Tables
`applications` · `status_history`

### Notes
- Status transitions must be enforced server-side — the frontend cannot be trusted to enforce pipeline order
- This phase unblocks Phase 8 (pool management depends on knowing who was not hired)

---

## Phase 6 — Scoring and Ranking

**Wave:** 4 | **Assigned to: Person 2**

### Deliverables
- WSM scoring service (Laravel): for each submitted application, compute:
  - Normalize each `raw_value` using criterion `min_value` / `max_value` (numeric) or `criterion_options.score_value` (select)
  - Compute `weighted_score = normalized_score × weight`
  - Write results to `application_form_responses` (normalized + weighted columns)
  - Sum weighted scores → write `total_wsm_score` on `applications`
- `POST /api/positions/{id}/score` — trigger scoring for all submitted applicants to a position
- `GET /api/positions/{id}/rankings` — returns ranked applicant list (backed by `v_applicant_rankings` view)
- `GET /api/applications/{id}/score-breakdown` — per-criterion breakdown (backed by `v_wsm_score_breakdown` view)
- Director access to ranking and breakdown endpoints (read-only)

### Key Tables
`application_form_responses` · `applications` · `criteria` · `criterion_options`

### Key Database Views Used
`v_applicant_rankings` · `v_wsm_score_breakdown`

### Notes
- WSM computation runs per position and should be re-triggerable if criteria weights are edited after initial scoring
- Do not expose scoring to applicants — breakdown is HR/Director only
- This phase is a hard prerequisite for Phase 7 (ILP uses `total_wsm_score` as input)

---

## Phase 7 — Assignment and Optimization (ILP)

**Wave:** 5 | **Assigned to: Person 4**

### Deliverables
- FastAPI endpoint `POST /run-assignment` — accepts:
  - `hiring_round_id`
  - `scope_applicant_type` (external / internal / both)
  - `scope_position_ids` (list of UUIDs, or null for all)
  - `scope_department_ids` (list of UUIDs, or null for all)
- ILP model using **PuLP** (CBC solver):
  - Decision variable: assign applicant `i` to position `j` (binary 0/1)
  - Objective: maximize total `total_wsm_score` of assigned applicants
  - Constraints:
    - Each position `j` assigned at most `slots_available` applicants
    - Each applicant assigned to at most one position
    - Only `status = 'applied'` or `status = 'for_review'` applicants included
- Writes results to `assignment_runs` and `assignment_results` via Laravel API (or direct DB write)
- `GET /api/assignment-runs/{id}` — results view for HR/Director
- Laravel endpoint `POST /api/assignment-runs` — triggers the FastAPI solver and stores the run record
- **Faculty workload allocation** (internal ILP variant):
  - Assigns internal faculty to courses
  - Constraints: max units per faculty, expertise alignment (from criteria scores)
  - Writes to `faculty_workload`

### Key Tables
`assignment_runs` · `assignment_results` · `faculty_workload`

### Notes
- Person 4 should query scores from the DB directly (read-only connection) rather than passing all data in the HTTP request body
- The Laravel controller creates the `assignment_runs` record (`status = 'pending'`), calls FastAPI, then updates the record to `completed` or `failed`
- ILP runs can take seconds for small datasets; use async/background task if the dataset grows large

---

## Phase 8 — Applicant Pool

**Wave:** 5 | **Assigned to: Person 3**

### Deliverables
- `POST /api/hiring-rounds/{id}/close` — closes the round, identifies unhired applicants
  - Creates `applicant_pool` records for all applicants whose final status is not `hired`
  - Sets `applications.is_pool_member = true` for those applicants
- `GET /api/applicant-pool` — HR-facing list with filters: semester, position, department, applicant type, pool status
- `POST /api/applicant-pool/{id}/reengage` — marks `reengagement_email_sent = true`, triggers email (notification hook from Phase 9)
- `PATCH /api/applicant-pool/{id}/status` — HR can manually set pool status to `inactive` or `expired`
- Applicant-facing `GET /api/applicant/pool-status` — shows the applicant their own pool membership if any

### Key Tables
`applicant_pool` · `applications`

### Key Database View Used
`v_active_pool`

### Notes
- Pool records are created per-position per-round; one applicant can have multiple pool entries
- Re-engagement email trigger is a stub in this phase — it will be wired to real email in Phase 9
- Runs in parallel with Phase 7; no dependency between pool management and ILP

---

## Phase 9 — Notifications

**Wave:** 6 | **Assigned to: Person 1**

### Deliverables
- Laravel Mail setup with Mailhog (dev) and configurable SMTP driver (prod)
- Notification service class that creates a `notifications` row and dispatches an email
- Wire the following event triggers:
  | Event                        | Trigger Location       | Recipient         |
  |------------------------------|------------------------|-------------------|
  | Application received         | Phase 4 submit         | Applicant         |
  | Status change                | Phase 5 status update  | Applicant         |
  | Internal account created     | Phase 3 staff account  | Internal staff    |
  | Pool invitation              | Phase 8 round close    | Applicant (pool)  |
  | Re-engagement email          | Phase 8 reengage       | Pool member       |
- `GET /api/notifications` — authenticated user's notification inbox (unread first)
- `PATCH /api/notifications/{id}/read` — mark as read (`read_at` timestamp)
- Email templates: plain, readable, institution-branded placeholder

### Key Tables
`notifications`

### Notes
- Each trigger from earlier phases should call `NotificationService::dispatch()` — keep notification logic out of controllers
- Mailhog UI is at `http://localhost:8025` during local development
- Do not send real emails during development — verify via Mailhog only
- This phase can partially backfill triggers into Phases 3–8 code without changing their logic

---

## Phase 10 — Dashboard Polish and Frontend Integration

**Wave:** 7 | **Assigned to: All**

This phase connects the existing Next.js frontend to the real Laravel API, replacing all mock data.

### Person 1 — API integration coordinator
- Define and document final API response shapes
- Replace `lib/adminData.ts` mock calls with real `fetch()` / Axios calls to Laravel
- Wire admin dashboard stats to real DB counts
- CSV export endpoint: `GET /api/admin/applicants/export`

### Person 2 — Admin and Director views
- Connect position management pages to Phase 2 API
- Connect ranking and score breakdown views to Phase 6 API
- Connect assignment results view to Phase 7 API
- Director read-only access verified end-to-end

### Person 3 — Applicant portal
- Connect application form to Phase 4 API (form fetch, draft save, submit)
- Connect document upload UI to Phase 4 document API
- Connect status tracker to Phase 5 API
- Connect notification inbox to Phase 9 API

### Person 4 — FastAPI hardening
- Add error handling and input validation to all FastAPI endpoints
- Ensure resume parser handles malformed PDFs gracefully
- ILP solver: test with edge cases (0 applicants, 1 slot, tie scores)
- Write basic FastAPI test suite

### Shared Deliverables
- End-to-end smoke test: register → apply → score → assign → notify
- Mobile responsiveness verified on applicant portal
- Role-based access verified: applicants cannot reach admin routes, directors cannot mutate data

---

## Dependency Map (Quick Reference)

```
Phase 1 (Foundation)
  └── Phase 2 (Position Config)
  └── Phase 3 (Accounts)
  └── FastAPI Setup
        └── Phase 2 + Phase 3 both complete
              └── Phase 4 (Forms + Resume Parser)
                    └── Phase 5 (Status Tracker)
                    └── Phase 6 (Scoring)
                          └── Phase 7 (ILP)
                    Phase 5 complete
                          └── Phase 8 (Pool)
                    Phase 5 + 6 + 7 + 8 complete
                          └── Phase 9 (Notifications)
                                └── Phase 10 (Polish)
```

---

## Shared Contracts (Agree Before Wave 3)

Before Phase 4 begins, the team must agree on:

1. **Local URLs** — Laravel API: `http://localhost:8000/api` · FastAPI: `http://localhost:8001` · Mailhog UI: `http://localhost:8025` · Next.js: `http://localhost:3000`
2. **Internal Docker URLs** — Laravel → FastAPI: `http://fastapi:8001` · Laravel → DB: `postgres:5432` · Laravel → Mailhog SMTP: `mailhog:1025`
3. **Auth header format** — `Authorization: Bearer <token>` from Sanctum for all protected Laravel routes
4. **Internal service auth** — Laravel → FastAPI via `X-Service-Key: <FASTAPI_SECRET_KEY>` header
5. **UUID format** — all IDs are UUIDs (confirmed in schema)
6. **Error response shape** — standard `{ "message": "...", "errors": {} }` for both Laravel and FastAPI
7. **Resume parser response JSON shape** — Person 4 defines this; Person 1 stores it in `parsed_resume_data`

---

## High-Risk Conflicts (Do Not Do These)

Taken from `STRICT_IMPLEMENTATION_SEQUENCE.md`:

- Do not build Phase 7 (ILP) before Phase 6 (Scoring) — ILP needs real WSM scores as input
- Do not build Phase 4 (Forms) before Phase 2 (Position Criteria) — form fields come from criteria
- Do not build Phase 8 (Pool) before Phase 5 (Status Tracker) — pool uses final application status
- Do not build Phase 9 (Notifications) before lifecycle events are stable — causes duplicate/fragile wiring

---

_Last updated: 2026-06-29_
