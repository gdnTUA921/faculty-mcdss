<?php

use App\Http\Controllers\Admin\StaffAccountController;
use App\Http\Controllers\Api\ApplicantProfileController;
use App\Http\Controllers\Api\CriterionOptionController;
use App\Http\Controllers\Api\PositionController;
use App\Http\Controllers\Api\PositionCriterionController;
use App\Http\Controllers\Api\PositionStatusController;
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
});

// ── Admin only ────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Phase 2: Positions CRUD
    Route::apiResource('positions', PositionController::class)->only(['index', 'store', 'show', 'update']);
    Route::patch('positions/{position}/status', PositionStatusController::class);

    // Phase 2: Criteria CRUD per position
    Route::get('positions/{position}/criteria', [PositionCriterionController::class, 'index']);
    Route::post('positions/{position}/criteria', [PositionCriterionController::class, 'store']);
    Route::put('criteria/{criterion}', [PositionCriterionController::class, 'update']);
    Route::delete('criteria/{criterion}', [PositionCriterionController::class, 'destroy']);

    // Phase 2: Criterion options CRUD
    Route::get('criteria/{criterion}/options', [CriterionOptionController::class, 'index']);
    Route::post('criteria/{criterion}/options', [CriterionOptionController::class, 'store']);
    Route::put('criterion-options/{criterionOption}', [CriterionOptionController::class, 'update']);
    Route::delete('criterion-options/{criterionOption}', [CriterionOptionController::class, 'destroy']);

    // Phase 3: Admin creates staff accounts
    Route::post('/admin/staff-accounts', StaffAccountController::class);
});

// ── Director only ─────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:director'])->prefix('director')->group(function () {
    // Phase 2+ routes go here
});

// ── Applicant profile (internal & external) ───────────────────────────────────
Route::middleware(['auth:sanctum', 'role:internal_applicant,external_applicant'])->group(function () {
    Route::get('/applicant/profile', [ApplicantProfileController::class, 'show']);
    Route::put('/applicant/profile', [ApplicantProfileController::class, 'update']);
});