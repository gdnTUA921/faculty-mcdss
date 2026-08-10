# Frontend Testing Guide — Phase 10C

A scripted end-to-end walkthrough of the wired frontend. It follows one hiring round from an empty
position to a closed round with a pooled applicant, so every screen gets exercised in the order a
real user would hit it.

**Time:** ~45–60 minutes for the full run. Parts 1–7 (~25 min) cover the critical path.

Tick the checklist at the end as you go. Anything that doesn't match the **Expect** line is a bug
worth reporting — except the items in *Known Gaps*, which are intentional.

---

## Before You Start

```bash
cd ~/faculty-mcds
docker compose up -d
docker compose exec laravel php artisan db:seed    # safe to re-run
```

Open these three tabs:

| | URL |
|---|---|
| App | http://localhost:3000 |
| Mailpit (all outgoing email) | http://localhost:8025 |
| API (sanity check) | http://localhost:8000/api/positions |

**Accounts** — all use password `password`:

| Email | Role |
|---|---|
| `admin@mcdss.local` | Admin / HR |
| `director@mcdss.local` | Academic Director (leads **COE** only) |
| `external@mcdss.local` | External applicant |
| `internal@mcdss.local` | Internal faculty applicant |

**Keep the browser devtools Network tab open.** Every screen should be hitting
`localhost:8000/api/...`. If you see a screen render data with no network call, that's a bug.

### One rule that explains most surprises

> A new application always attaches to the **active hiring round with the latest start date.**

If two rounds are active, the newer one wins. This is why Part 2 comes before Part 4.

---

## Part 1 — Auth & Role Guards (5 min)

| # | Do this | Expect |
|---|---|---|
| 1.1 | Go to http://localhost:3000 | Real login form. **No** "Demo Role" selector, no pre-filled credentials |
| 1.2 | Sign in with a wrong password | Red banner: *"The provided credentials are incorrect."* Stays on the login page |
| 1.3 | Sign in as `admin@mcdss.local` | Lands on `/admin`. Sidebar shows **Admin User**, not a hardcoded name |
| 1.4 | Manually visit `/applicant/dashboard` | Bounced back to `/admin` — the guard sends you to your own area |
| 1.5 | Manually visit `/director` | Bounced back to `/admin` |
| 1.6 | Hard-refresh (Cmd-Shift-R) on `/admin` | Brief spinner, then the dashboard. You stay signed in |
| 1.7 | Click **Sign Out** | Back to login. Now type `/admin` in the address bar → redirected to login |
| 1.8 | Sign in as `director@mcdss.local` | Lands on `/director`, sidebar shows **Academic Director** |
| 1.9 | Visit `/admin/positions` as the director | Bounced to `/director` |

Sign back in as **admin** for Part 2.

---

## Part 2 — Create the Hiring Round (3 min)

Everything downstream attaches to this round.

| # | Do this | Expect |
|---|---|---|
| 2.1 | **Hiring Rounds** in the sidebar | Table of existing rounds with an Applications count per row |
| 2.2 | **Create Round**, fill in:<br>Name: `AY 2027 Test Round`<br>Semester: `1st Semester`<br>Academic Year: `2027`<br>Start: `2026-08-01`<br>End: `2027-06-30`<br>Leave **Make this round active** ticked | Green banner, new row appears with status **Active** |
| 2.3 | Try creating a round with End Date *before* Start Date | Red inline error — the API rejects it |
| 2.4 | Try Academic Year `1999` | Rejected |
| 2.5 | Click **Edit** on your new active round, change the End Date, **Save Changes** | Green banner, row updates. Status stays **Active** — the edit form has no status control; that only lives on Close/Archive |

> The start date `2026-08-01` is deliberately later than the seeded round's `2026-06-01`, so your
> new round becomes the one applications attach to.

---

## Part 3 — Position + Criteria (8 min)

| # | Do this | Expect |
|---|---|---|
| 3.1 | **Positions → Create Position**:<br>Title: `Assistant Professor — Test`<br>Department: **COE**<br>Target Type: **External**<br>Slots: `2`<br>Deadline: `2027-03-31` | Created. Amber note warned you it opens immediately |
| 3.2 | Look at the new row | **Criteria** column says `0 criteria` with a red *"Needs setup"* |
| 3.3 | Open the position → **Criteria & Weights** tab | Empty state. Weight pill reads **0% — Must equal 100%** |
| 3.4 | Note the **Run Scoring** button | **Disabled**, tooltip explains weights must total 100% |
| 3.5 | **Add Criterion**: `Years of Teaching Experience`, type **Numeric**, weight `50`, Min `0`, Max `20`, required | Added. Weight pill → **50%**, still amber |
| 3.6 | **Add Criterion**: `Has PRC License`, type **Boolean**, weight `20`, required | Weight pill → **70%** |
| 3.7 | **Add Criterion**: `Highest Degree`, type **Select**, weight `30`. An **Options** editor appears — add:<br>`Doctorate` / `doctorate` / `1.0`<br>`Masters` / `masters` / `0.6`<br>`Bachelors` / `bachelors` / `0.3` | Weight pill → **100% — Valid**, now green |
| 3.8 | Try saving a Select criterion with **zero** options | Blocked with a message about applicants seeing an empty dropdown |
| 3.9 | Note the **Run Scoring** button now | **Enabled** |
| 3.10 | Edit a criterion, change its weight, save | Weight pill recalculates immediately |
| 3.11 | On the position header, click **Edit**, change the Title or Slots Available, **Save Changes** | Green banner, header updates. Department and Target Applicant Type are still editable here — no applicant has applied to this position yet |

**Deadline check:** two places, both of which were broken before.

1. In the **Edit** modal you just opened, the **Application Deadline** field is pre-filled with
   `2027-03-31` — not blank. (The API returns a full ISO datetime; a `date` input silently rejects
   anything that isn't `YYYY-MM-DD`, so the value used to disappear the moment you clicked Edit.)
2. Back on the positions list, the Deadline column reads **Mar 31, 2027**, not "—".

> **Once an applicant has applied** (from Part 4 onward), reopen this Edit modal — Department and
> Target Applicant Type switch to disabled with a lock note, since changing either after the fact
> would misrepresent who was eligible when they applied. Verified in Part 12.7.

---

## Part 4 — Applicant Applies (12 min)

Sign out. **Register a brand-new applicant** rather than reusing a seeded one — it exercises the
registration path too.

| # | Do this | Expect |
|---|---|---|
| 4.1 | **Register as External Applicant**. Use a unique email, e.g. `test.applicant@example.com`, password `password123`, tick the terms box | Signed straight in, landing on `/applicant/dashboard` |
| 4.2 | Check Mailpit | A **verification email** arrived |
| 4.3 | Dashboard | "Welcome back, <your first name>". Stats show `0` applications and a non-zero Open Positions count |
| 4.4 | **Open Positions** | Your `Assistant Professor — Test` card appears, showing `2 slots`, the Mar 31 2027 deadline, and `3 evaluation criteria` |
| 4.5 | Look for an **Internal**-only position in the list | There should be none — external applicants only see External and Both |
| 4.6 | Click **Apply Now** | Resume upload step (Step 1 of 2). There is **no "Skip and fill the form manually" link** — a resume is required |
| 4.7 | Upload any PDF or DOCX | Parses, then lands on **Your Resume Details** — a full editable form, not a read-only summary |
| 4.8 | Scroll the whole review form | Ten grouped cards: Contact Information, Education, Experience, Certifications & Licenses, Skills, Research Interests, Publications, Research Projects, Professional Development, Awards & Honors |
| 4.9 | Check the Contact card | Name, Email, Phone, **Address / Location, LinkedIn, Portfolio** — all editable inputs |
| 4.10 | Find a section your CV didn't cover | It still renders, with an **Add** button and a note that nothing was found. Missing fields stay blank — the parser never invents values |
| 4.11 | Edit a field, **Add** an entry, then **Remove** one | All three work. An "Edited — saved when you continue" note appears once you change anything |
| 4.12 | Click **Continue to Application Form** | Corrections saved to your profile — no crash, no dead end |
| 4.13 | On the form (Step 2 of 2) | Your **3 criteria** render: a number input, Yes/No radios, and a dropdown with **Doctorate / Masters / Bachelors**. (This screen used to dead-end with "HR is still configuring this position's form" — if you see that message, the criteria/form fix regressed) |
| 4.14 | Fill in `8` years, **Yes**, **Doctorate**. Click **Save Draft** | Green "Draft saved" banner |
| 4.15 | Navigate to **Open Positions** (not My Applications) | Your position card shows an amber **"Continue your draft"** button, not "Already applied" and not a plain "Apply Now" — a draft must never look like either of those |
| 4.16 | Click **Continue your draft** | Lands on **Step 1** with your resume details rehydrated and editable — **no re-upload demanded**. (It used to jump straight to the criteria form, leaving these fields unreachable) |
| 4.17 | Click **Continue to Application Form** | Back on the criteria form with your saved answers still filled in |
| 4.18 | Navigate away to **My Applications** | One card, status **Draft**, amber note that drafts are never reviewed. Button says *Continue Application* |
| 4.19 | Click it | Step 1 again, resume details intact; forward to the form and **your saved answers are still there** — this is the draft-rehydration path |
| 4.20 | Click **Submit Application** | Success screen |
| 4.21 | Check Mailpit | *Application Received* email |
| 4.22 | **Notifications** in the top nav | 1 unread, type **Application Received** |
| 4.23 | **My Applications** | Status now **Applied**, pipeline tracker shows stage 1 |
| 4.24 | Back on **Open Positions** | Card now shows **Already applied** — a submitted application (unlike a draft) does hide the Apply button |

---

## Part 5 — Admin Reviews (9 min)

Sign out, back in as **admin**.

| # | Do this | Expect |
|---|---|---|
| 5.1 | **Applicants** | Your new applicant is in the **External** tab. WSM Score column says *Not scored* |
| 5.2 | Confirm the draft you saved in 4.14 is **not** listed anywhere | Drafts are hidden from HR by design |
| 5.3 | Toggle to the **Internal Staff** tab | Different (probably empty) result set |
| 5.4 | Search `test` in the search box, press Enter | Filters to your applicant |
| 5.5 | Set Status filter to **Hired** | Your applicant disappears. Result count updates |
| 5.6 | Reset filters, click the applicant's name | Detail page with 5 tabs |
| 5.7 | **Application** tab | Your 3 submitted answers are listed with their weights |
| 5.8 | **Documents** tab | Your uploaded resume, with a **Verified** column reading amber **Unverified**. Click **Download** — the file downloads with its original filename |
| 5.9 | Click **Verify** on that row | Badge turns green **Verified**, with **by Admin User · <today>** underneath. Verification is attributable, not an anonymous flag |
| 5.10 | Click **Unverify** | Back to amber **Unverified**; the attribution line disappears. Reversible, in case you sign off by mistake |
| 5.11 | Click **Verify** again, leaving it verified | Needed for step 11.8 |
| 5.12 | **Status History** tab | Empty — no changes yet |
| 5.13 | Click **Update Status** | Dropdown offers **For Interview**, **Rejected**, **Withdrawn** only. It does *not* offer For Review or Hired — the pipeline is strictly linear |
| 5.14 | Choose **For Interview**, add a note like `Strong CV`, save | Green banner; badge updates |
| 5.15 | **Status History** tab | One entry: `applied → for_interview`, with your note and **Admin User** as the actor |
| 5.16 | Check Mailpit | *Status Changed* email to the applicant |
| 5.17 | Back on the list, click **Export CSV** | Downloads `applicants-<timestamp>.csv`. Open it — your applicant is a row |
| 5.18 | Filter Status = **For Interview**, export again | The CSV contains only for_interview rows — filters carry through |
| 5.19 | **Notifications** in the sidebar | An unread **New Application Submitted** entry from your test applicant's Part 4.20 submission — this is a new admin-facing signal, separate from the applicant's own inbox |

---

## Part 6 — Scoring & Rankings (4 min)

| # | Do this | Expect |
|---|---|---|
| 6.1 | **Positions → Assistant Professor — Test → Run Scoring** | Green banner: scoring complete |
| 6.2 | **Applicants** tab on that position | Your applicant appears with a rank and a WSM score. **Their name reads "First Last" with a space** — a database view bug used to concatenate it as "FirstLast" |
| 6.3 | Verify the score | `8/20 × 0.50` + `Yes × 0.20` + `Doctorate(1.0) × 0.30` = **0.7000** |
| 6.4 | Applicant detail → **Score Breakdown** tab | Ring chart plus a per-criterion table. The Total row equals the ring value |
| 6.5 | Applicants list → Sort = **Highest score** | Scored applicants sort above unscored ones (unscored sink to the bottom, never the top) |

> If 6.3 shows a different number, check your answers in 4.14 — the arithmetic above assumes exactly
> `8` / Yes / Doctorate.

---

## Part 7 — Director Read-Only & Department Scoping (6 min)

First, as **admin**, create a position the director should *not* be able to see:

- **Positions → Create Position**: Title `Out Of Scope Test`, Department **COB** (or CAS), Slots `1`.

Now sign out and in as `director@mcdss.local`.

| # | Do this | Expect |
|---|---|---|
| 7.1 | Director dashboard | Department name is **College of Engineering**. Director card shows the real signed-in user |
| 7.2 | Note the counters | Scoped to COE — never larger than the admin's numbers |
| 7.3 | **Positions** | `Assistant Professor — Test` is listed. **`Out Of Scope Test` is NOT** — that's the scoping working |
| 7.4 | Open `Assistant Professor — Test` | Criteria table (read-only, no edit/delete buttons) and Ranked Applicants |
| 7.5 | Confirm there is no Create/Edit/Run Scoring button anywhere | Directors are read-only |
| 7.6 | Click a ranked applicant | Read-only profile with an amber "Read-only view" banner. Score breakdown and documents are visible; **no Update Status button, and no Verify button on documents** — signing off on a credential is an admin action |
| 7.7 | **Assignment Results** | Read-only. No configure/run controls |
| 7.8 | In the address bar, paste the COB position's URL (copy its ID from the admin tab) | **"This position is not in your department"** — a 404, not a 403. It doesn't confirm the record exists |
| 7.9 | **Notifications** in the sidebar (new item — director previously had no notifications page at all) | An unread **New Application Submitted** entry from Part 4.20, since this director leads COE and that's where your test applicant applied |

---

## Part 8 — Assignment Run (5 min)

Back to **admin**.

| # | Do this | Expect |
|---|---|---|
| 8.1 | **Assignment** | Hiring Round pre-selected to your active round. "Last run" bar shows history or "No assignment runs yet" |
| 8.2 | Set Applicant Type = **External**, leave Departments = All, Positions = All | — |
| 8.3 | **Run Assignment Algorithm** → confirm in the modal | Green banner. Results table populates with real applicant names |
| 8.4 | Check the summary bar | Assigned count, candidates evaluated, objective score |
| 8.5 | Click an applicant name in the results | Jumps to their admin detail page |
| 8.6 | If more than one run exists, use the run picker top-right | Switches between historical runs |
| 8.7 | Try a run scoped to a department with no scored applicants | Friendly message, not a crash — the solver returning nothing is handled |

---

## Part 9 — Close the Round → Pool → Re-engage (5 min)

| # | Do this | Expect |
|---|---|---|
| 9.1 | **Hiring Rounds** → your `AY 2027 Test Round` → **Close Round** | Confirmation modal warns unhired applicants move to the pool |
| 9.2 | Confirm | Status → **Closed**. Message reports how many pool entries were created |
| 9.3 | Check Mailpit | *Pool Invitation* email to your test applicant |
| 9.4 | **Applicant Pool** | Your applicant is listed with pool status **Active**, Re-engagement **Not Sent** |
| 9.5 | Filter by Round / Department / Type | Filters narrow the list |
| 9.6 | Click **Re-engage** | Green banner. Re-engagement → **Sent**, pool status → **Re-engaged** |
| 9.7 | Click **Re-engage** on the same row again | Button is disabled — can't double-send |
| 9.8 | Check Mailpit | *Re-engagement* email |
| 9.9 | Click **Expire** on that row | Status → **Expired** |
| 9.10 | Sign in as your test applicant → **My Applications** | Application still visible with its history intact |
| 9.11 | Back as admin → **Hiring Rounds** → your now-**Closed** round | No **Edit** button — only **Archive** appears. Closed rounds back real applications and pool entries, so they're no longer editable |
| 9.12 | Click **Archive** | Green banner: "Hiring round archived." Status → **Archived**, and now neither Edit nor Archive appears — archived is terminal |

---

## Part 10 — Staff Accounts & Temp Password (5 min)

As **admin**:

| # | Do this | Expect |
|---|---|---|
| 10.1 | **Staff Accounts** | List of admin/director/internal accounts. **Self-registered applicants are not listed** |
| 10.2 | Create: `Test`, `Director`, `test.director@example.com`, role **Academic Director** | Green banner. New row shows Password = **Temporary** |
| 10.3 | Check Mailpit | Account-created email containing a generated temporary password |
| 10.4 | Copy that password, sign out, sign in as `test.director@example.com` | Signed in, lands on `/director` |
| 10.5 | Note the dashboard | Likely empty — this director leads no department yet. That's correct scoping, not a bug |
| 10.6 | Back as admin → **Resend Email** on that row | New temp password emailed. The **old one stops working** |
| 10.7 | **Deactivate** that account | Status → Inactive |
| 10.8 | Try signing in as that account | *"Account is deactivated."* |
| 10.9 | As admin, try **Deactivate** on your **own** row | Blocked — prevents locking yourself out |
| 10.10 | Reactivate the test account | Sign-in works again |

---

## Part 11 — Profile, Password, Notifications (4 min)

Sign in as your test applicant.

| # | Do this | Expect |
|---|---|---|
| 11.1 | **Profile** | Name / email / phone are **read-only** with a note that HR manages them |
| 11.2 | Edit **Professional Summary**, save | Green banner. Refresh — the text persists |
| 11.3 | **Change Password**: current `password123`, new `newpassword456` twice | Green banner |
| 11.4 | Keep clicking around the portal | **You stay signed in.** (The API revokes all tokens here; the app stores the replacement) |
| 11.5 | Sign out, sign in with the **new** password | Works |
| 11.6 | **Notifications** | All your notifications. Unread ones have a blue border |
| 11.7 | **Unread** tab, then **Mark all as read** | Unread count → 0, borders clear |
| 11.8 | **Documents** | Your resume is listed. An amber banner explains documents are locked because you've submitted an application — **Delete is disabled on every row**. Uploading a *new* document still works |
| 11.9 | Hover the disabled delete icon on the resume | Tooltip reads *"Verified documents cannot be deleted"* (you verified it in 5.11). Other rows read *"Locked — this document is part of a submitted application"* |

---

## Part 12 — Error Handling & Edge Cases (5 min)

| # | Do this | Expect |
|---|---|---|
| 12.1 | Stop the API: `docker compose stop laravel`. Reload any admin page | A clean error state with a **Try again** button — not a blank page or an infinite spinner |
| 12.2 | `docker compose start laravel`, wait ~10s, click **Try again** | Data loads |
| 12.3 | Visit `/admin/applicants/00000000-0000-0000-0000-000000000000` | "Could not load this data", not a crash |
| 12.4 | As an applicant, try to apply to a position with **0 criteria** | The card says it isn't accepting applications yet; no Apply button |
| 12.5 | Close a position (admin), then view it as an applicant | It disappears from Open Positions |
| 12.6 | Try applying twice to the same position | The card shows **Already applied** with your current status instead of an Apply button |
| 12.7 | Admin → open **Assistant Professor — Test** (your test applicant applied here in Part 4) → **Edit** → try changing Department or Target Applicant Type | Both fields are disabled with a lock note naming the applicant count. Title, Slots, and Deadline are still editable in the same form |

---

## Part 13 — Mobile (3 min)

Devtools → device toolbar → iPhone SE (375px).

| # | Check | Expect |
|---|---|---|
| 13.1 | Login page | Branding panel hides, form fills the screen |
| 13.2 | Applicant dashboard | Stats become 2-up; bottom nav bar appears |
| 13.3 | Open Positions | Cards stack one per row |
| 13.4 | Application form | Inputs are full width and tappable |
| 13.5 | Admin tables | Scroll **horizontally inside the table**; the page itself shouldn't scroll sideways |

---

## Known Gaps — Expected, Not Bugs

Please don't file these:

1. **Admin → Notifications has no "Trigger Notification" button.** Notifications are raised by
   system events by design (Phase 9). That page is your own inbox.
2. **Admin → Assignment → Faculty Workload Allocation shows an explanatory panel, not a table.**
   The FastAPI solver writes to `faculty_workload`, but Laravel exposes no route for it. **This is a
   real gap** if you need that table for sign-off — tell me and I'll add the endpoint.
3. **No "Move to Pool" bulk action on the applicants table.** Pool membership comes from closing a
   round. Replaced with CSV export.
4. **No "Internal Staff Information" block on the application form.** Those fields map to no
   columns — internal-specific questions belong in that position's criteria.
5. **Applicant phone shows "—".** `/auth/user` doesn't return phone, and there's no endpoint to
   edit it.
6. **A director with no department sees empty screens.** Correct scoping.

---

## Results Checklist

```
[ ] Part 1  — Auth & role guards
[ ] Part 2  — Hiring round created, validation works
[ ] Part 3  — Position + 3 criteria, weights reach 100%, select options save, deadline persists
[ ] Part 4  — Register → upload → edit parsed details → draft → resume draft at step 1 → submit
[ ] Part 5  — Review, document verify/unverify, status transition, CSV export
[ ] Part 6  — Scoring produces 0.7000, breakdown matches
[ ] Part 7  — Director read-only; out-of-department position hidden + 404
[ ] Part 8  — Assignment run completes with real names
[ ] Part 9  — Round close → pool → re-engage → expire
[ ] Part 10 — Staff account, temp password login, deactivate
[ ] Part 11 — Profile, password change keeps session, notifications, documents locked
[ ] Part 12 — Error states recover cleanly
[ ] Part 13 — Mobile layout
```

**When reporting a bug, include:** the part/step number, what you expected vs saw, the failing
request from the Network tab (method, URL, status), and the response body.

---

## Cleaning Up

The walkthrough leaves behind a round, two positions, a test applicant and a staff account. To wipe
everything and start from a clean database:

```bash
docker compose exec laravel php artisan migrate:fresh --seed
```

⚠️ This destroys **all** data, including the Phase 4–9 test records already in the database. Only
run it if you're happy to lose those.
