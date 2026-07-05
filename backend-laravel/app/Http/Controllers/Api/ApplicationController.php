<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use App\Models\Application;
use App\Models\ApplicationFormResponse;
use App\Models\HiringRound;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ApplicationController extends Controller
{
    public function store(StoreApplicationRequest $request): JsonResponse
    {
        $applicantProfile = $request->user()->applicantProfile;

        if (! $applicantProfile) {
            abort(422, 'Applicant profile not found for this user.');
        }

        $activeRound = HiringRound::where('status', 'active')->latest('start_date')->first();

        if (! $activeRound) {
            abort(422, 'No active hiring round is currently configured.');
        }

        $validated = $request->validated();

        $existing = Application::where('applicant_profile_id', $applicantProfile->id)
            ->where('position_id', $validated['position_id'])
            ->where('hiring_round_id', $activeRound->id)
            ->first();

        if ($existing) {
            return response()->json($existing, 200);
        }

        $application = Application::create([
            'applicant_profile_id' => $applicantProfile->id,
            'position_id' => $validated['position_id'],
            'hiring_round_id' => $activeRound->id,
            'status' => 'draft',
        ]);

        return response()->json($application, 201);
    }

    public function update(UpdateApplicationRequest $request, Application $application): JsonResponse
    {
        $this->assertOwnership($request, $application);

        if ($application->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => ['This application can no longer be edited.'],
            ]);
        }

        $validated = $request->validated();

        $criterionIds = collect($validated['responses'])->pluck('criterion_id');
        $validCriterionIds = $application->position->criteria()->whereIn('id', $criterionIds)->pluck('id');

        if ($criterionIds->diff($validCriterionIds)->isNotEmpty()) {
            throw ValidationException::withMessages([
                'responses' => ['One or more criteria do not belong to this position.'],
            ]);
        }

        foreach ($validated['responses'] as $response) {
            ApplicationFormResponse::updateOrCreate(
                [
                    'application_id' => $application->id,
                    'criterion_id' => $response['criterion_id'],
                ],
                [
                    'raw_value' => $response['raw_value'] ?? null,
                    'responded_at' => now(),
                ]
            );
        }

        return response()->json([
            'message' => 'Responses saved.',
            'data' => $application->fresh()->load('formResponses'),
        ]);
    }

    public function submit(Request $request, Application $application): JsonResponse
    {
        $this->assertOwnership($request, $application);

        if ($application->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => ['This application has already been submitted.'],
            ]);
        }

        $position = $application->position;
        $applicantProfile = $application->applicantProfile;

        if ($position->status !== 'open') {
            throw ValidationException::withMessages([
                'status' => ['This position is not currently open for applications.'],
            ]);
        }

        if ($position->target_applicant_type !== 'both'
            && $position->target_applicant_type !== $applicantProfile->applicant_type) {
            throw ValidationException::withMessages([
                'status' => ['This position is not open to your applicant type.'],
            ]);
        }

        $application->update([
            'status' => 'applied',
            'applied_at' => now(),
        ]);

        return response()->json([
            'message' => 'Application submitted successfully.',
            'data' => $application->fresh(),
        ]);
    }

    private function assertOwnership(Request $request, Application $application): void
    {
        $applicantProfile = $request->user()->applicantProfile;

        if (! $applicantProfile || $application->applicant_profile_id !== $applicantProfile->id) {
            abort(404);
        }
    }
}
