<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AccountCreated;
use App\Models\ApplicantProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class StaffAccountController extends Controller
{
    public function __invoke(Request $request): JsonResponse
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

        Mail::to($user->email)->send(new AccountCreated($tempPassword));

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
}
