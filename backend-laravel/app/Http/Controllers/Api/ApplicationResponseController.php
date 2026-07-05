<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationResponseController extends Controller
{
    public function index(Request $request, Application $application): JsonResponse
    {
        $applicantProfile = $request->user()->applicantProfile;

        if (! $applicantProfile || $application->applicant_profile_id !== $applicantProfile->id) {
            abort(404);
        }

        $responses = $application->formResponses()->get(['criterion_id', 'raw_value']);

        return response()->json($responses);
    }
}
