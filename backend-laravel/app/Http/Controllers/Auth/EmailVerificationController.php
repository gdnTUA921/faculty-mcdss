<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class EmailVerificationController extends Controller
{
    public function __invoke(string $token): JsonResponse
    {
        $record = DB::table('email_verification_tokens')
            ->where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (! $record) {
            return response()->json(['message' => 'Invalid or expired verification token.'], 400);
        }

        $user = \App\Models\User::find($record->user_id);

        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->update(['email_verified_at' => now()]);

        DB::table('email_verification_tokens')->where('id', $record->id)->delete();

        return response()->json(['message' => 'Email verified successfully.']);
    }
}
