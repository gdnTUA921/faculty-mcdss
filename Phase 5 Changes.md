### Files Created

- **`database/migrations/2026_07_06_000001_create_status_history_table.php`** — creates `status_history` table (immutable audit log)
- **`app\Models\StatusHistory.php`** — Eloquent model with `application()` and `changedBy()` relations
- **`app\Http\Requests\UpdateApplicationStatusRequest.php`** — FormRequest with admin authorization and status/notes validation
- **`app\Http\Controllers\Api\ApplicationStatusController.php`** — single-action controller enforcing valid transitions (`applied→for_interview→for_review→hired`, with `rejected`/`withdrawn` from any active state)
- **`app\Http\Controllers\Api\StatusHistoryController.php`** — returns full audit trail ordered by `changed_at`

### Files Modified

- **`app\Models\Application.php`** — added `statusHistory()` HasMany relation
- **`app\Http\Controllers\Api\ApplicationController.php`** — added `show()` method returning current status, pipeline position (e.g. "2 of 4"), position title, and hiring round name
- **`routes\api.php`** — registered 3 new routes under appropriate middleware groups

### Routes Added
MethodPathAccessDescription`PATCH``/api/applications/{application}/status``admin`Advance application status with server-side transition enforcement`GET``/api/applications/{application}/status-history``admin`Full immutable audit trail`GET``/api/applicant/applications/{application}``applicant`Current status + pipeline position (ownership-gated)
### Key Design Decisions

- Status transitions are enforced server-side via a whitelist map — the frontend cannot override pipeline order
- Every status change inserts a new `status_history` row (never updates existing rows)
- The `submit()` endpoint (Phase 4) remains responsible for `draft→applied`; this phase handles all subsequent transitions
- Final states (`hired`, `rejected`, `withdrawn`) are terminal and reject further changes