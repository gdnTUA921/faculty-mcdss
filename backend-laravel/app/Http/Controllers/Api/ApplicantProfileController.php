<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApplicantProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicantProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = ApplicantProfile::where('user_id', $request->user()->id)->firstOrFail();

        return response()->json($profile);
    }

    public function update(Request $request): JsonResponse
    {
        $profile = ApplicantProfile::where('user_id', $request->user()->id)->firstOrFail();

        $data = $request->validate([
            'institution_email' => ['nullable', 'email', 'max:255'],
            'summary'           => ['nullable', 'string', 'max:5000'],
        ]);

        $isFirstSave = $profile->profile_completed_at === null;

        $profile->fill($data);

        if ($isFirstSave) {
            $profile->profile_completed_at = now();
        }

        $profile->save();

        return response()->json($profile);
    }
}
