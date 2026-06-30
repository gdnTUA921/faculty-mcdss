<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

// ── Public ────────────────────────────────────────────────────────────────────
Route::post('/auth/login', [AuthController::class, 'login']);

// ── Authenticated (any role) ──────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/user',            [AuthController::class, 'user']);
    Route::post('/auth/logout',         [AuthController::class, 'logout']);
    Route::post('/auth/change-password',[AuthController::class, 'changePassword']);
});

// ── Admin only ────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    // Phase 2+ routes go here
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
