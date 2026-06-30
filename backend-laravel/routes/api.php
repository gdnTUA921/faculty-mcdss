<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Api\CriterionOptionController;
use App\Http\Controllers\Api\PositionController;
use App\Http\Controllers\Api\PositionCriterionController;
use App\Http\Controllers\Api\PositionStatusController;
use Illuminate\Support\Facades\Route;

// ── Public ────────────────────────────────────────────────────────────────────
Route::post('/auth/login', [AuthController::class, 'login']);

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
});

// ── Director only ─────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:director'])->prefix('director')->group(function () {
    // Phase 2+ routes go here
});

// ── Internal applicant ────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:internal_applicant'])->prefix('internal')->group(function () {
    // Phase 3+ routes go here
});

// ── External applicant ────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:external_applicant'])->prefix('external')->group(function () {
    // Phase 3+ routes go here
});