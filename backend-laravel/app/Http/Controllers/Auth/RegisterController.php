<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\EmailVerification;
use App\Models\ApplicantProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class RegisterController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name'  => ['required', 'string', 'max:100'],
            'email'      => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'   => ['required', 'string', 'min:8', 'confirmed'],
            'phone'      => ['nullable', 'string', 'max:30'],
        ]);

        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'first_name' => $data['first_name'],
                'last_name'  => $data['last_name'],
                'email'      => $data['email'],
                'password'   => $data['password'],
                'role'       => 'external_applicant',
                'phone'      => $data['phone'] ?? null,
            ]);

            ApplicantProfile::create([
                'user_id'        => $user->id,
                'applicant_type' => 'external',
            ]);

            return $user;
        });

        $token = Str::random(64);
        DB::table('email_verification_tokens')->insert([
            'user_id'    => $user->id,
            'token'      => $token,
            'expires_at' => now()->addHour(),
        ]);

        Mail::to($user->email)->send(new EmailVerification($token));

        $apiToken = $user->createToken('api-token', [$user->role])->plainTextToken;

        return response()->json([
            'message' => 'Registration successful. Please check your email to verify your address.',
            'token'   => $apiToken,
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
