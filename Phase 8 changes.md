Phase 8 — Applicant Pool is complete. Here's the summary:

### Files Created

| File | Purpose |
|------|---------|
| `database/migrations/2026_07_20_000001_create_applicant_pool_table.php` | Creates `applicant_pool` table with UUID PK, FKs to `applicant_profiles`/`hiring_rounds`/`positions`, pool status enum, re-engagement tracking fields, and indexes |
| `app\Models\ApplicantPool.php` | Eloquent model with `$table = 'applicant_pool'`, relations to `applicantProfile()`, `hiringRound()`, `position()` |
| `app\Http\Requests\UpdatePoolStatusRequest.php` | FormRequest — `admin`/`director` authorization, validates `status` is `inactive` or `expired` |
| `app\Http\Controllers\Api\HiringRoundCloseController.php` | Invokable: validates round is active, collects unhired apps (`applied`/`for_interview`/`for_review`/`rejected`/`withdrawn`), creates pool entries via `firstOrCreate`, sets `is_pool_member=true`, closes round |
| `app\Http\Controllers\Api\ApplicantPoolController.php` | Four endpoints: `index` (filtered list), `reengage` (set re-engagement flag + status→`reengaged`), `updateStatus` (HR sets to inactive/expired), `myStatus` (applicant-facing) |

### Routes Added (5 total)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `POST` | `/api/hiring-rounds/{hiringRound}/close` | `admin` | Close round, create pool entries for unhired applicants |
| `GET` | `/api/applicant-pool` | `admin,director` | Filterable list (`hiring_round_id`, `position_id`, `department_id`, `applicant_type`, `pool_status`) |
| `POST` | `/api/applicant-pool/{applicantPool}/reengage` | `admin,director` | Mark re-engagement email sent, set status → `reengaged` |
| `PATCH` | `/api/applicant-pool/{applicantPool}/status` | `admin,director` | Set pool status to `inactive` or `expired` |
| `GET` | `/api/applicant/pool-status` | `applicant` | Returns current user's pool memberships |

### Key Design Decisions
- Pool records use `firstOrCreate` to avoid duplicates per `(applicant_profile_id, hiring_round_id, position_id)` — per the unique constraint
- Re-engagement email trigger is a stub (sets flag + status only); will be wired to real email in Phase 9
- Draft applications are excluded when populating the pool (only submitted apps qualify)
- Pool list returns nested data: applicant name/email/type via user+profile, position title+department, hiring round info


File additions and changes (incase needed to check)

backend-laravel/app/http/controllers/api/Applicantpoolcontroller.php 

backend-laravel/app/http/controllers/api/hiringroundclosecontroller.php

backend-laravel/app/http/request/updatePoolstatusrequest.php

backend-laravel/app/models/ApplicationPool.php

create applicant ppol table in migrations

api.php edited and added supervisord.pid

Recommendations!

After tapos na to gawa to security audit of the app and code review urgent.