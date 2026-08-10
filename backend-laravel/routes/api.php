<?php

use App\Http\Controllers\Admin\StaffAccountController;
use App\Http\Controllers\Api\AdminApplicationController;
use App\Http\Controllers\Api\ApplicantPoolController;
use App\Http\Controllers\Api\ApplicantPositionController;
use App\Http\Controllers\Api\ApplicantProfileController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\ApplicationDocumentController;
use App\Http\Controllers\Api\ApplicationResponseController;
use App\Http\Controllers\Api\ApplicationScoreBreakdownController;
use App\Http\Controllers\Api\ApplicationStatusController;
use App\Http\Controllers\Api\AssignmentRunController;
use App\Http\Controllers\Api\CriterionOptionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\HiringRoundArchiveController;
use App\Http\Controllers\Api\HiringRoundCloseController;
use App\Http\Controllers\Api\HiringRoundController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PositionController;
use App\Http\Controllers\Api\PositionCriterionController;
use App\Http\Controllers\Api\PositionFormController;
use App\Http\Controllers\Api\PositionRankingController;
use App\Http\Controllers\Api\PositionScoringController;
use App\Http\Controllers\Api\PositionStatusController;
use App\Http\Controllers\Api\StatusHistoryController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\RegisterController;

use Illuminate\Support\Facades\Route;

// ── Public ────────────────────────────────────────────────────────────────────
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/register', RegisterController::class);
Route::post('/email/verify/{token}', EmailVerificationController::class);

// ── Authenticated (any role) ──────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Phase 9: Notifications inbox
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

    // Phase 10: Bulk read + authenticated document download (per-role checks inside)
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::get('/documents/{document}/download', [ApplicationDocumentController::class, 'download']);
});

// ── Admin only ────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Phase 2: Positions CRUD (index/show moved to the shared group for directors)
    Route::post('positions', [PositionController::class, 'store']);
    Route::put('positions/{position}', [PositionController::class, 'update']);
    Route::patch('positions/{position}/status', PositionStatusController::class);

    // Phase 2: Criteria CRUD per position (index moved to the shared group)
    Route::post('positions/{position}/criteria', [PositionCriterionController::class, 'store']);
    Route::put('criteria/{criterion}', [PositionCriterionController::class, 'update']);
    Route::delete('criteria/{criterion}', [PositionCriterionController::class, 'destroy']);

    // Phase 2: Criterion options CRUD
    Route::get('criteria/{criterion}/options', [CriterionOptionController::class, 'index']);
    Route::post('criteria/{criterion}/options', [CriterionOptionController::class, 'store']);
    Route::put('criterion-options/{criterionOption}', [CriterionOptionController::class, 'update']);
    Route::delete('criterion-options/{criterionOption}', [CriterionOptionController::class, 'destroy']);

    // Phase 3 + 10: Staff account management
    Route::get('/admin/staff-accounts', [StaffAccountController::class, 'index']);
    Route::post('/admin/staff-accounts', [StaffAccountController::class, 'store']);
    Route::post('/admin/staff-accounts/{user}/resend-invite', [StaffAccountController::class, 'resendInvite']);
    Route::patch('/admin/staff-accounts/{user}/status', [StaffAccountController::class, 'updateStatus']);

    // Phase 5: Application status management
    Route::patch('applications/{application}/status', ApplicationStatusController::class);

    // Phase 6: Admin scoring trigger
    Route::post('positions/{position}/score', PositionScoringController::class);

    // Phase 8: Round close & pool management
    Route::post('hiring-rounds/{hiringRound}/close', HiringRoundCloseController::class);

    // Phase 10: Hiring round management
    Route::post('hiring-rounds', [HiringRoundController::class, 'store']);
    Route::put('hiring-rounds/{hiringRound}', [HiringRoundController::class, 'update']);
    Route::post('hiring-rounds/{hiringRound}/archive', HiringRoundArchiveController::class);

    // Document verification. Admin only -- directors are read-only, so they can
    // view and download a credential but not sign off on it.
    Route::patch('documents/{document}/verify', [ApplicationDocumentController::class, 'verify']);

    // Phase 10: moved out of the shared group -- directors are read-only per the plan.
    Route::post('assignment-runs', [AssignmentRunController::class, 'store']);
    Route::post('applicant-pool/{applicantPool}/reengage', [ApplicantPoolController::class, 'reengage']);
    Route::patch('applicant-pool/{applicantPool}/status', [ApplicantPoolController::class, 'updateStatus']);
});

// ── Shared Admin & Director routes (director results are department-scoped) ────
Route::middleware(['auth:sanctum', 'role:admin,director'])->group(function () {
    // Phase 10: Dashboard counters + recent activity
    Route::get('dashboard/stats', [DashboardController::class, 'stats']);

    // Phase 10: Reference data
    Route::get('departments', [DepartmentController::class, 'index']);
    Route::get('hiring-rounds', [HiringRoundController::class, 'index']);
    Route::get('hiring-rounds/{hiringRound}', [HiringRoundController::class, 'show']);

    // Phase 2: Read-only position + criteria access
    Route::get('positions', [PositionController::class, 'index']);
    Route::get('positions/{position}', [PositionController::class, 'show']);
    Route::get('positions/{position}/criteria', [PositionCriterionController::class, 'index']);

    // Phase 10: Applicant table, detail, documents and CSV export
    Route::get('admin/applicants/export', [AdminApplicationController::class, 'export']);
    Route::get('applications', [AdminApplicationController::class, 'index']);
    Route::get('applications/{application}', [AdminApplicationController::class, 'show']);
    Route::get('applications/{application}/documents', [ApplicationDocumentController::class, 'index']);

    // Phase 5: Status trail
    Route::get('applications/{application}/status-history', StatusHistoryController::class);

    // Phase 6 + 7: Rankings, score breakdown, assignment runs (read-only)
    Route::get('positions/{position}/rankings', [PositionRankingController::class, 'index']);
    Route::get('applications/{application}/score-breakdown', [ApplicationScoreBreakdownController::class, 'index']);
    Route::get('assignment-runs', [AssignmentRunController::class, 'index']);
    Route::get('assignment-runs/{assignmentRun}', [AssignmentRunController::class, 'show']);

    // Phase 8: Applicant pool (read-only)
    Route::get('applicant-pool', [ApplicantPoolController::class, 'index']);
});

// ── Applicant profile (internal & external) ───────────────────────────────────
Route::middleware(['auth:sanctum', 'role:internal_applicant,external_applicant'])->group(function () {
    Route::get('/applicant/profile', [ApplicantProfileController::class, 'show']);
    Route::put('/applicant/profile', [ApplicantProfileController::class, 'update']);

    // Phase 10: Browse open positions this applicant is eligible for
    Route::get('/applicant/positions', [ApplicantPositionController::class, 'index']);
    Route::get('/applicant/positions/{position}', [ApplicantPositionController::class, 'show']);

    // Phase 4: Form definition
    Route::get('positions/{position}/form', [PositionFormController::class, 'show']);

    // Phase 4: Application draft/submit lifecycle
    Route::post('/applications', [ApplicationController::class, 'store']);
    Route::put('/applications/{application}', [ApplicationController::class, 'update']);
    Route::post('/applications/{application}/submit', [ApplicationController::class, 'submit']);
    Route::get('/applications/{application}/responses', [ApplicationResponseController::class, 'index']);

    // Phase 4: Document upload
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);

    // Phase 5 + 10: Applicant-facing application list & status view
    Route::get('/applicant/applications', [ApplicationController::class, 'index']);
    Route::get('/applicant/applications/{application}', [ApplicationController::class, 'show']);

    // Phase 8: Applicant-facing pool status
    Route::get('/applicant/pool-status', [ApplicantPoolController::class, 'myStatus']);
});
