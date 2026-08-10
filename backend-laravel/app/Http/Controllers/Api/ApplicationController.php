<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use App\Mail\ApplicationReceived;
use App\Models\Application;
use App\Models\ApplicationFormResponse;
use App\Models\HiringRound;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ApplicationController extends Controller
{
    /**
     * The signed-in applicant's own applications, drafts included —
     * the portal needs drafts so an unfinished application can be resumed.
     */
    public function index(Request $request): JsonResponse
    {
        $applicantProfile = $request->user()->applicantProfile;

        if (! $applicantProfile) {
            return response()->json(['data' => []]);
        }

        $applications = Application::where('applicant_profile_id', $applicantProfile->id)
            ->with([
                'position:id,title,department_id,application_deadline',
                'position.department:id,name,code',
                'hiringRound:id,name,semester,academic_year',
            ])
            ->withCount('documents')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->orderByDesc('applied_at')
            ->get()
            ->map(fn ($application) => [
                'id'       => $application->id,
                'position' => $application->position ? [
                    'id'                   => $application->position->id,
                    'title'                => $application->position->title,
                    'application_deadline' => $application->position->application_deadline?->toDateString(),
                    'department'           => $application->position->department ? [
                        'id'   => $application->position->department->id,
                        'name' => $application->position->department->name,
                        'code' => $application->position->department->code,
                    ] : null,
                ] : null,
                'hiring_round' => $application->hiringRound ? [
                    'id'            => $application->hiringRound->id,
                    'name'          => $application->hiringRound->name,
                    'semester'      => $application->hiringRound->semester,
                    'academic_year' => $application->hiringRound->academic_year,
                ] : null,
                'status'            => $application->status,
                'documents_count'   => $application->documents_count,
                'applied_at'        => $application->applied_at?->toIso8601String(),
                'status_updated_at' => $application->status_updated_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $applications]);
    }

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

        $applicantUser = $applicantProfile->user;
        NotificationService::dispatch(
            $applicantUser,
            'application_received',
            'Application Received',
            "Your application for {$position->title} has been received.",
            new ApplicationReceived($applicantUser->first_name . ' ' . $applicantUser->last_name, $position->title),
            $application->id,
        );

        $director = $position->department?->director;

        if ($director) {
            // In-app only: no Mailable, so this doesn't add to the director's inbox
            // on top of the applicant-facing emails already sent per submission.
            NotificationService::dispatch(
                $director,
                'application_submitted',
                'New Application Submitted',
                "{$applicantUser->first_name} {$applicantUser->last_name} applied for {$position->title}.",
                null,
                $application->id,
            );
        }

        // Admins are the only ones who can actually move an application through
        // the pipeline (PATCH .../status is role:admin only), so they need this
        // signal at least as much as the director does. Bulk-inserted so the
        // admin count never adds per-recipient round trips to this request.
        NotificationService::dispatchInAppToMany(
            User::where('role', 'admin')->get(),
            'application_submitted',
            'New Application Submitted',
            "{$applicantUser->first_name} {$applicantUser->last_name} applied for {$position->title}.",
            $application->id,
        );

        return response()->json([
            'message' => 'Application submitted successfully.',
            'data' => $application->fresh(),
        ]);
    }

    public function show(Request $request, Application $application): JsonResponse
    {
        $this->assertOwnership($request, $application);

        $pipeline = ['applied', 'for_interview', 'for_review', 'hired'];
        $currentIndex = array_search($application->status, $pipeline, true);
        $pipelinePosition = $currentIndex !== false ? $currentIndex + 1 : null;
        $totalSteps = count($pipeline);

        return response()->json([
            'data' => [
                'id'                 => $application->id,
                'status'             => $application->status,
                'pipeline_position'  => $pipelinePosition,
                'total_steps'        => $totalSteps,
                'applied_at'         => $application->applied_at?->toIso8601String(),
                'status_updated_at'  => $application->status_updated_at?->toIso8601String(),
                'position'           => [
                    'id'    => $application->position->id,
                    'title' => $application->position->title,
                ],
                'hiring_round'       => [
                    'id'   => $application->hiringRound->id,
                    'name' => $application->hiringRound->name,
                ],
                // Additive for Phase 10: the portal status tracker renders the trail.
                'status_history'     => $application->statusHistory()
                    ->orderByDesc('changed_at')
                    ->get()
                    ->map(fn ($entry) => [
                        'id'              => $entry->id,
                        'previous_status' => $entry->previous_status,
                        'new_status'      => $entry->new_status,
                        'changed_at'      => $entry->changed_at?->toIso8601String(),
                    ])->values(),
            ],
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
