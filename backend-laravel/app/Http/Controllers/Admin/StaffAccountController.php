<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AccountCreated;
use App\Models\ApplicantProfile;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StaffAccountController extends Controller
{
    /** Roles this screen manages — applicants self-register and are excluded. */
    private const STAFF_ROLES = ['admin', 'director', 'internal_applicant'];

    public function index(Request $request): JsonResponse
    {
        $accounts = User::whereIn('role', self::STAFF_ROLES)
            ->when($request->filled('role'), fn ($q) => $q->where('role', $request->input('role')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->input('search') . '%';
                $q->where(fn ($inner) => $inner->where('first_name', 'ilike', $term)
                    ->orWhere('last_name', 'ilike', $term)
                    ->orWhere('email', 'ilike', $term));
            })
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('role')
            ->orderBy('last_name')
            ->get()
            ->map(fn ($user) => [
                'id'                => $user->id,
                'first_name'        => $user->first_name,
                'last_name'         => $user->last_name,
                'full_name'         => trim($user->first_name . ' ' . $user->last_name),
                'email'             => $user->email,
                'phone'             => $user->phone,
                'role'              => $user->role,
                'account_status'    => $user->is_active ? 'active' : 'inactive',
                'is_active'         => $user->is_active,
                'has_temp_password' => $user->is_temp_password,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'created_at'        => $user->created_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $accounts]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name'  => ['required', 'string', 'max:100'],
            'email'      => ['required', 'email', 'max:255', 'unique:users,email'],
            'role'       => ['required', 'string', 'in:admin,director,internal_applicant'],
            'phone'      => ['nullable', 'string', 'max:30'],
        ]);

        $tempPassword = Str::password(12);

        $user = DB::transaction(function () use ($data, $tempPassword) {
            $user = User::create([
                'first_name'      => $data['first_name'],
                'last_name'       => $data['last_name'],
                'email'           => $data['email'],
                'password'        => $tempPassword,
                'role'            => $data['role'],
                'phone'           => $data['phone'] ?? null,
                'is_temp_password' => true,
            ]);

            if ($data['role'] === 'internal_applicant') {
                ApplicantProfile::create([
                    'user_id'        => $user->id,
                    'applicant_type' => 'internal',
                ]);
            }

            return $user;
        });

        NotificationService::dispatch(
            $user,
            'account_created',
            'Your Account Has Been Created',
            'Your account has been created. Check your email for your temporary password.',
            new AccountCreated($tempPassword),
        );

        return response()->json([
            'message' => 'Staff account created successfully. An email has been sent with login instructions.',
            'user'    => [
                'id'         => $user->id,
                'first_name' => $user->first_name,
                'last_name'  => $user->last_name,
                'email'      => $user->email,
                'role'       => $user->role,
            ],
        ], 201);
    }

    /**
     * Re-issue the account invite. The original temp password is hashed and
     * unrecoverable, so a fresh one is generated and all sessions revoked.
     */
    public function resendInvite(User $user): JsonResponse
    {
        if (! in_array($user->role, self::STAFF_ROLES, true)) {
            abort(404);
        }

        $tempPassword = Str::password(12);

        $user->update([
            'password'         => $tempPassword,
            'is_temp_password' => true,
        ]);

        $user->tokens()->delete();

        NotificationService::dispatch(
            $user,
            'account_created',
            'Your Account Access Has Been Reset',
            'A new temporary password has been issued for your account.',
            new AccountCreated($tempPassword),
        );

        return response()->json([
            'message' => 'Invitation resent. A new temporary password has been emailed.',
        ]);
    }

    /** Enable or disable sign-in without deleting the account's history. */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        if (! in_array($user->role, self::STAFF_ROLES, true)) {
            abort(404);
        }

        if ($user->id === $request->user()->id) {
            abort(422, 'You cannot change the status of your own account.');
        }

        $data = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $user->update(['is_active' => $data['is_active']]);

        if (! $data['is_active']) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => $data['is_active'] ? 'Account activated.' : 'Account deactivated.',
            'data'    => [
                'id'             => $user->id,
                'email'          => $user->email,
                'account_status' => $user->is_active ? 'active' : 'inactive',
            ],
        ]);
    }
}
