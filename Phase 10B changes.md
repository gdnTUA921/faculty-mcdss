# Phase 10B — Frontend Integration (complete)

The Next.js app had **zero `fetch()` calls across all 30 pages** and no real authentication —
`app/page.tsx` was a demo login with three hardcoded accounts, and every screen read from
`lib/adminData.ts`, `lib/directorData.ts` or `lib/applicantData.ts`.

All three mock files are now **deleted**. Every page calls the real Laravel API.

- `npx tsc --noEmit` — clean
- `npx next build` — 27 routes compiled
- `MCDSS_Phase10.postman_collection.json` — 90 requests / 199 assertions, 0 failures

---

## Foundation Created

| File | Purpose |
|------|---------|
| `lib/api/client.ts` | The only place that talks to the network. Attaches the bearer token, normalises errors into `ApiError` (keeping Laravel's field-keyed `errors` for forms), drops the session and redirects on 401, and streams authenticated file downloads |
| `lib/auth.tsx` | `AuthProvider` (hydrates from localStorage, then re-validates against `/auth/user`), `useAuth()`, and `RequireRole` — the client-side route guard |
| `lib/types.ts` | TypeScript types for every API response shape, snake_case to match the wire format |
| `lib/api/admin.ts` | Admin + director surface — 40 typed calls |
| `lib/api/applicant.ts` | Applicant portal surface |
| `lib/useResource.ts` | `useResource` (fetch on mount + on dependency change, with `reload`) and `useMutation` |
| `lib/format.ts` | Dates, decimals-as-strings, file sizes, status labels |
| `components/shared/DataState.tsx` | Loading skeletons, error/empty states, inline banners |
| `components/admin/StatusUpdateModal.tsx` | Status transitions, restricted to the moves the API accepts |

## Auth

Real Sanctum bearer-token login replaces the demo. Signing in routes each role to its own dashboard,
and `RequireRole` bounces anyone who lands on another role's area. The three layouts stay server
components (so they keep exporting `metadata`) and wrap their children in the guard. Sign-out calls
`POST /auth/logout` and clears local state. The sidebars and top nav show the real signed-in user.

**Registration** signs the applicant straight in — `POST /api/register` already returns a usable
token, so there is no second round-trip.

**Password change** stores the *new* token the endpoint returns. `changePassword` revokes every
existing token server-side, so without this the user's own session would die on their next click.

## Pages Wired (23)

**Admin (10)** — dashboard (live counters + activity feed), applicants table (9 server-side filters,
pagination, CSV export, inline status updates), applicant detail (5 tabs: profile, application,
documents, score breakdown, status history), positions list (create, open/close), position detail
(criteria CRUD, run scoring, live rankings), hiring rounds (create, close, archive), assignment
(configure + run the ILP solver, browse run history), applicant pool (re-engage, expire), staff
accounts (create, resend invite, activate/deactivate), notifications.

**Applicant (8)** — dashboard, open positions (eligibility-filtered), apply flow (resume upload →
parse → dynamic criteria form → submit), my applications, application detail with status trail,
documents (upload/download/delete), notifications, profile + password change.

**Director (5)** — dashboard, positions list, position detail with criteria and rankings, applicant
detail (read-only), assignment results filtered to their own department.

---

## Three Places the Mock Promised Something the API Cannot Do

These were fictional in the mock. Rather than fake them, each screen now states the real situation:

1. **Admin → "Trigger Notification"** — there is no manual-send endpoint. Phase 9 notifications are
   raised by system events, deliberately. The page is now the admin's own inbox, with a note
   explaining that and a link to Mailpit.
2. **Admin → Assignment → "Faculty Workload Allocation"** — the FastAPI solver writes to
   `faculty_workload`, but Laravel exposes no route for it. The section explains this instead of
   showing invented rows. **This is a genuine gap if the workload table is required for Phase 10
   sign-off.**
3. **Applicants → "Move to Pool" bulk action** — pool membership is created by closing a hiring
   round (the Phase 8 design), never by direct assignment. Replaced with CSV export, which the
   plan actually calls for.

Two smaller ones: the apply form's "Internal Staff Information" block (current role, years of
service, teaching load) maps to no columns — internal-specific questions belong in that position's
criteria. And the applicant profile now shows name/email/phone read-only, because
`ApplicantProfileController@update` only accepts `institution_email` and `summary`.

---

## Two More Backend Bugs Found While Wiring

1. **`StorePositionRequest` never accepted `application_deadline`** — the update request did, but
   create silently dropped it. That is why every position in the database had a NULL deadline, which
   I had flagged earlier as "seed data looks sparse". It was a real bug. Fixed and verified: a
   position created with a deadline now keeps it.

2. **CORS hid the download filename.** Preflight passed, but `Content-Disposition` is not readable
   from JavaScript cross-origin unless it is explicitly exposed, so every CSV export and document
   download would have saved under a generic fallback name. Added `config/cors.php` with
   `exposed_headers => ['Content-Disposition']`, and narrowed `allowed_origins` from the framework
   default `*` to the two localhost frontend origins.

Also corrected: my first draft of the status modal allowed `applied → for_review` and
`for_interview → hired`. The backend enforces a strictly linear pipeline
(`applied → for_interview → for_review → hired`, with reject/withdraw available at each step), so
the dropdown was rebuilt to mirror `ApplicationStatusController::VALID_TRANSITIONS` exactly. It can
no longer offer a transition the API will reject.

---

## Running It

```bash
docker compose up -d
docker compose exec laravel php artisan db:seed   # adds the missing applicant profiles
open http://localhost:3000
```

`NEXT_PUBLIC_API_URL` is already set to `http://localhost:8000/api` in `docker-compose.yml`.

**Sign-in accounts** (all password `password`): `admin@mcdss.local` · `director@mcdss.local` ·
`external@mcdss.local` · `internal@mcdss.local`.

The seeded director leads COE, so their views are scoped to it. Positions currently live only in
COE, so a director sees nearly everything an admin does — create a position in COB or CAS to see
scoping take visible effect.

---

## What Is Not Done

- **No frontend test suite.** Verification was typecheck + production build + the API collection.
  There is no Playwright/Vitest coverage of the React layer.
- **Mobile responsiveness has not been verified on a device.** The mock's responsive classes are
  preserved throughout, but the plan's "verified on applicant portal" item needs a real check.
- **FastAPI hardening (plan's Person 4) is untouched.** `backend-py/tests/test_main.py` still has
  its original 10 tests and none of the Phase 10 edge cases — 0 applicants, 1 slot, tie scores,
  malformed PDF. This was scoped out of 10A and 10B; it remains open.
