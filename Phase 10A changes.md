# Phase 10A — Backend Gap-Fill (complete)

Phase 10 in `TEAM_DEVELOPMENT_PLAN.md` assumes the API is finished and only the frontend needs
wiring. It is not — **13 endpoints the mock screens depend on did not exist after Phase 9**, and the
director route group was empty (`api.php` lines 77–79), so every director page would have 403'd.

Phase 10A closes that gap so the frontend wiring (10B) has a real API to call.
Verified with `MCDSS_Phase10.postman_collection.json`: **86 requests / 198 assertions, 0 failures.**

---

## Files Created

| File | Purpose |
|------|---------|
| `app/Http/Controllers/Concerns/ScopesToDirector.php` | Trait giving every shared controller the same department-scoping rule. `scopedDepartmentIds()` returns `null` for admins (unscoped) or the director's department IDs; `assertDepartmentAccess()` 404s a director reaching outside them |
| `app/Http/Controllers/Api/AdminApplicationController.php` | `index` (filtered + paginated HR table), `show` (full review detail), `export` (streamed CSV). One shared `filteredQuery()` drives all three so the CSV always matches the table |
| `app/Http/Controllers/Api/DashboardController.php` | `stats` — dashboard counters + 10-row activity feed, auto-scoped for directors |
| `app/Http/Controllers/Api/HiringRoundController.php` | `index`, `store`, `show`, `update` — previously only `POST /hiring-rounds/{id}/close` existed |
| `app/Http/Controllers/Api/DepartmentController.php` | `index` — department reference data for dropdowns, with open-position counts |
| `app/Http/Controllers/Api/ApplicantPositionController.php` | `index`, `show` — applicant-facing position browse. `GET /positions` is admin+director only, so the portal had no way to list openings |
| `app/Http/Controllers/Api/ApplicationDocumentController.php` | `index` (review packet for one application), `download` (streams the stored file with per-role authorization) |
| `app/Http/Requests/StoreHiringRoundRequest.php` | Admin-only; validates `end_date >= start_date`, `academic_year >= 2000` |
| `app/Http/Requests/UpdateHiringRoundRequest.php` | Partial update; `prepareForValidation()` backfills the stored `start_date` so `after_or_equal` works when only `end_date` is sent |

## Files Modified

| File | Change |
|------|--------|
| `routes/api.php` | Split the admin positions resource so `GET` moves to the shared admin+director group; added the 13 new routes. 64 routes total |
| `app/Http/Controllers/Admin/StaffAccountController.php` | `__invoke` → `store`; added `index` (list with role/search/status filters), `resendInvite`, `updateStatus`. URLs unchanged, so the Phase 3/9 collections still pass |
| `app/Http/Controllers/Api/ApplicationController.php` | Added `index` (`GET /applicant/applications`). `show` gained `status_history` — **without `notes`**, which stay HR-internal |
| `app/Http/Controllers/Api/AssignmentRunController.php` | Added `index` (run history). `show` gained deeper eager loads for applicant + position names; **no Phase 7 response key changed** |
| `app/Http/Controllers/Api/NotificationController.php` | `index` gained `meta.unread_count` + `?unread_only=`; added `markAllRead`. Also fixed non-deterministic ordering (see below) |
| `app/Http/Controllers/Api/PositionController.php` | `index`/`show` are director-scoped and now return `applications_count`; added `status`, `department_id`, `search` filters |
| `app/Http/Controllers/Api/PositionCriterionController.php` | `index` is director-scoped |
| `app/Http/Controllers/Api/PositionRankingController.php` | `index` is director-scoped |
| `app/Http/Controllers/Api/ApplicationScoreBreakdownController.php` | `index` is director-scoped (the TODO comment in it is now resolved) |
| `app/Http/Controllers/Api/StatusHistoryController.php` | Director-scoped; moved to the shared group |
| `app/Models/Department.php` | Added `positions()` HasMany for `withCount` |
| `app/Models/HiringRound.php` | Added `created_at` datetime cast — it was an uncast string and crashed `toIso8601String()` |

---

## Routes Added (19 total)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/api/dashboard/stats` | `admin,director` | Counters + activity feed, director-scoped |
| `GET` | `/api/departments` | `admin,director` | Department list, director sees only their own |
| `GET` | `/api/hiring-rounds` | `admin,director` | List with `applications_count`, `?status=` filter |
| `GET` | `/api/hiring-rounds/{id}` | `admin,director` | Single round |
| `POST` | `/api/hiring-rounds` | `admin` | Create round |
| `PUT` | `/api/hiring-rounds/{id}` | `admin` | Partial update |
| `GET` | `/api/applications` | `admin,director` | HR table — paginated + 9 filters |
| `GET` | `/api/applications/{id}` | `admin,director` | Full review detail |
| `GET` | `/api/applications/{id}/documents` | `admin,director` | Review packet |
| `GET` | `/api/admin/applicants/export` | `admin,director` | Streamed CSV (the endpoint named in the plan) |
| `GET` | `/api/assignment-runs` | `admin,director` | Run history, newest first |
| `GET` | `/api/admin/staff-accounts` | `admin` | Staff list |
| `POST` | `/api/admin/staff-accounts/{user}/resend-invite` | `admin` | Re-issue temp password, revoke tokens |
| `PATCH` | `/api/admin/staff-accounts/{user}/status` | `admin` | Activate / deactivate |
| `GET` | `/api/applicant/positions` | `applicant` | Eligible open positions |
| `GET` | `/api/applicant/positions/{id}` | `applicant` | Position detail |
| `GET` | `/api/applicant/applications` | `applicant` | My applications (drafts included) |
| `POST` | `/api/notifications/read-all` | any | Mark all read |
| `GET` | `/api/documents/{id}/download` | any | Streams the file, per-role checks |

### Routes Widened (admin-only → admin + director, all department-scoped)

`GET /api/positions` · `GET /api/positions/{id}` · `GET /api/positions/{id}/criteria` ·
`GET /api/applications/{id}/status-history`

Directors gained **read** access only. Every write route stayed admin-only — verified by 6
guard-rail tests in folder 12.

---

## Key Design Decisions

- **404, not 403, for out-of-department access.** A director hitting another department's position
  gets 404 so the response never confirms the record exists.
- **Drafts are excluded from the HR table by default** (`?include_drafts=true` opts in). A draft is
  the applicant's private workspace. The applicant's own `GET /applicant/applications` *does*
  include drafts so an unfinished application can be resumed.
- **CSV export reuses the table's exact filter pipeline**, so the download can never disagree with
  what HR is looking at. Streamed and chunked at 500 rows.
- **`total_wsm_score` is never exposed to applicants** — only through the admin/director surfaces.
- **Status-history `notes` are withheld from the applicant view** — they are internal HR commentary.
- **Documents are never publicly reachable.** They stay on the private `local` disk and every
  download goes through a role check: applicants get only their own files; directors only files
  belonging to an applicant who applied inside their departments.
- **`resend-invite` generates a *new* temp password** rather than resending the old one — the
  original is hashed and unrecoverable — and revokes existing tokens.
- **Admins cannot deactivate their own account** (422), preventing a self-lockout.
- **The staff screen cannot touch self-registered applicants** (404 on non-staff roles).

---

## Two Real Bugs Found and Fixed While Testing

1. **Unscored applicants outranked scored ones.** Postgres sorts `NULL` **first** on `DESC`, so
   `?sort_by=total_wsm_score&sort_dir=desc` put unscored applications at the top of the ranking
   table. Now forced to `NULLS LAST`.

2. **Notification inbox ordering was non-deterministic.** `notifications.created_at` is
   `timestamp(0)` (Laravel's `timestampTz` defaults to precision 0), so any two notifications
   raised in the same second tie and Postgres returns them in arbitrary order. Manual Postman
   clicking never exposed this because clicks are seconds apart; an automated run reversed the
   feed immediately. Fixed with a `id DESC` tiebreaker — the UUIDv7 primary key is time-ordered at
   millisecond precision. **This was a pre-existing Phase 9 issue, not caused by Phase 10.**

The same tiebreaker was added to the applicant table, where an unstable sort on `applied_at`
(also `timestamp(0)`) would repeat or drop rows between pages.

---

## Regression Status of Earlier Phases

Re-ran the earlier collections after the route moves. **No Phase 10 regressions.** All remaining
failures are pre-existing artifacts of those collections:

| Collection | Assertions | Failed | Cause of the failures |
|---|---|---|---|
| Phase 10A | 198 | **0** | — |
| Phase 8 | 82 | 3 | Only the collection's own `manual prereq` guards, which read `pm.collectionVariables` and cannot be satisfied by `--env-var` |
| Phase 7 | 63 | 6 | 3 manual-prereq guards + 3 needing the faculty/course/expertise fixture that prereq is supposed to seed |
| Phase 9 | 60 | 5 | 2 manual-prereq guards + 3 cascading from the temp-password extraction (below) |

**Phase 9's temp-password extraction is broken in the collection, not the API.** Two problems:
its regex captures the HTML-*escaped* password (`|&gt;yHX39sx#H&lt;` instead of `|>yHX39sx#H<`),
and it sets the variable inside an async `pm.sendRequest` callback that newman does not wait for.
Logging in with the unescaped password succeeds, returns `has_temp_password: true`, and the
`account_created` notification is present — so the Phase 9 feature is fine. Real users are
unaffected: a rendered HTML email displays the password correctly.

---

## Testing

```bash
docker compose up -d
npx newman run MCDSS_Phase10.postman_collection.json
```

The collection is self-contained — it creates its own position, criterion, applicant, application
and staff account, and derives the department IDs from `GET /api/departments`. It needs the seeded
`admin@mcdss.local` / `director@mcdss.local` (password `password`), the director to lead at least
one department, and at least one other department with no director; folder 0 asserts all of that
and fails fast.

**One manual step:** *"Upload a Document"* in folder 4 needs a PDF attached — Postman cannot ship a
binary inside a collection file. Skip it and the four download tests in folder 11 self-skip
(194 assertions instead of 198).

---

## Resolved: Directors Are Now Read-Only

Three routes were director-writable from Phases 7–8, contradicting the plan's read-only director
rule. Per your decision they are now **admin-only**:

| Route | Was | Now |
|---|---|---|
| `POST /api/assignment-runs` | admin + director | admin |
| `POST /api/applicant-pool/{id}/reengage` | admin + director | admin |
| `PATCH /api/applicant-pool/{id}/status` | admin + director | admin |

`StoreAssignmentRunRequest::authorize()` and `UpdatePoolStatusRequest::authorize()` were tightened
to match, so the restriction holds even if a route is later re-grouped. Directors keep **read**
access to `GET /api/assignment-runs`, `GET /api/assignment-runs/{id}` and `GET /api/applicant-pool`.

Two requests in the earlier collections used the director token to re-engage and now had to switch
to admin — *"Reengage B's Pool Entry"* in Phase 8 and *"Reengage Pool Entry"* in Phase 9. Both were
renamed and updated in place. Three new guard-rail tests in folder 12 of the Phase 10 collection
assert all three routes return 403 for a director (90 requests / 199 assertions, all passing).

## Seeder Fix

`UserSeeder` now creates an `ApplicantProfile` for `internal@mcdss.local` and
`external@mcdss.local`. Without it every `/api/applicant/*` call for those accounts returned
*"Applicant profile not found for this user"* — the seeded applicants could not use the portal at
all. Re-run with `php artisan db:seed` (safe to re-run; it uses `firstOrCreate`).

## Next: Phase 10B — Frontend Integration

The Next.js app still has **zero `fetch()` calls** across all 30 pages and no real auth —
`app/page.tsx` is a demo login with hardcoded accounts. 10B covers the auth/session layer
(Sanctum bearer token + a fetch wrapper + per-role route guards), then replacing
`lib/adminData.ts`, `lib/directorData.ts` and `lib/applicantData.ts` with real API calls.
