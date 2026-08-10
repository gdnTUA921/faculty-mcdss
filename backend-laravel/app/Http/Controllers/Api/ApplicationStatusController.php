<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateApplicationStatusRequest;
use App\Mail\StatusChanged;
use App\Models\Application;
use App\Models\StatusHistory;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ApplicationStatusController extends Controller
{
    private const array VALID_TRANSITIONS = [
        'applied'      => ['for_interview', 'rejected', 'withdrawn'],
        'for_interview' => ['for_review', 'rejected', 'withdrawn'],
        'for_review'   => ['hired', 'rejected', 'withdrawn'],
    ];

    public function __invoke(UpdateApplicationStatusRequest $request, Application $application): JsonResponse
    {
        $validated = $request->validated();
        $newStatus = $validated['status'];
        $currentStatus = $application->status;

        if ($currentStatus === 'draft') {
            throw ValidationException::withMessages([
                'status' => ['This application has not been submitted yet and cannot be progressed.'],
            ]);
        }

        if ($currentStatus === 'hired' || $currentStatus === 'rejected' || $currentStatus === 'withdrawn') {
            throw ValidationException::withMessages([
                'status' => ['Applications in a final state (' . $currentStatus . ') cannot be changed.'],
            ]);
        }

        $allowed = self::VALID_TRANSITIONS[$currentStatus] ?? [];

        if (!in_array($newStatus, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => ["Invalid transition from '{$currentStatus}' to '{$newStatus}'."],
            ]);
        }

        $previousStatus = $application->status;

        $application->update([
            'status' => $newStatus,
            'status_updated_at' => now(),
        ]);

        StatusHistory::create([
            'application_id'  => $application->id,
            'previous_status' => $previousStatus,
            'new_status'      => $newStatus,
            'notes'           => $validated['notes'] ?? null,
            'changed_by'      => $request->user()->id,
            'changed_at'      => now(),
        ]);

        $applicantUser = $application->applicantProfile->user;
        NotificationService::dispatch(
            $applicantUser,
            'status_change',
            'Your Application Status Has Changed',
            "Your application for {$application->position->title} moved from {$previousStatus} to {$newStatus}.",
            new StatusChanged($application->position->title, $previousStatus, $newStatus),
            $application->id,
        );

        return response()->json([
            'message' => 'Application status updated successfully.',
            'data' => $application->fresh(),
        ]);
    }
}
