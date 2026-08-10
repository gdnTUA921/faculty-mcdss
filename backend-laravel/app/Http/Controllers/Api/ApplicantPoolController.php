<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePoolStatusRequest;
use App\Mail\ReengagementEmail;
use App\Models\ApplicantPool;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ApplicantPoolController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ApplicantPool::with([
            'applicantProfile.user:id,first_name,last_name,email',
            'applicantProfile:id,user_id,applicant_type,institution_email',
            'hiringRound:id,name,semester,academic_year',
            'position:id,title,department_id',
            'position.department:id,name',
        ]);

        if ($request->filled('hiring_round_id')) {
            $query->where('hiring_round_id', $request->input('hiring_round_id'));
        }

        if ($request->filled('semester')) {
            $query->whereHas('hiringRound', fn ($q) => $q->where('semester', $request->input('semester')));
        }

        if ($request->filled('position_id')) {
            $query->where('position_id', $request->input('position_id'));
        }

        if ($request->filled('department_id')) {
            $query->whereHas('position', fn ($q) => $q->where('department_id', $request->input('department_id')));
        }

        if ($request->filled('applicant_type')) {
            $query->whereHas('applicantProfile', fn ($q) => $q->where('applicant_type', $request->input('applicant_type')));
        }

        if ($request->filled('pool_status')) {
            $query->where('status', $request->input('pool_status'));
        }

        $pool = $query->orderBy('created_at', 'desc')->get()
            ->map(fn ($entry) => [
                'id'                   => $entry->id,
                'applicant'            => $entry->applicantProfile ? [
                    'id'               => $entry->applicantProfile->id,
                    'first_name'       => $entry->applicantProfile->user->first_name ?? null,
                    'last_name'        => $entry->applicantProfile->user->last_name ?? null,
                    'email'            => $entry->applicantProfile->user->email ?? null,
                    'applicant_type'   => $entry->applicantProfile->applicant_type,
                    'institution_email'=> $entry->applicantProfile->institution_email,
                ] : null,
                'position'             => $entry->position ? [
                    'id'               => $entry->position->id,
                    'title'            => $entry->position->title,
                    'department'       => $entry->position->department ? [
                        'id'           => $entry->position->department->id,
                        'name'         => $entry->position->department->name,
                    ] : null,
                ] : null,
                'hiring_round'         => $entry->hiringRound ? [
                    'id'               => $entry->hiringRound->id,
                    'name'             => $entry->hiringRound->name,
                    'semester'         => $entry->hiringRound->semester,
                    'academic_year'    => $entry->hiringRound->academic_year,
                ] : null,
                'pool_status'          => $entry->status,
                'reengagement_email_sent' => $entry->reengagement_email_sent,
                'reengagement_sent_at' => $entry->reengagement_sent_at?->toIso8601String(),
                'confirmed_interest'   => $entry->confirmed_interest,
                'responded_at'         => $entry->responded_at?->toIso8601String(),
                'created_at'           => $entry->created_at->toIso8601String(),
            ]);

        return response()->json(['data' => $pool]);
    }

    public function reengage(ApplicantPool $applicantPool): JsonResponse
    {
        if ($applicantPool->reengagement_email_sent) {
            throw ValidationException::withMessages([
                'pool_entry' => ['Re-engagement email has already been sent for this pool entry.'],
            ]);
        }

        $applicantPool->update([
            'reengagement_email_sent' => true,
            'reengagement_sent_at'    => now(),
            'status'                  => 'reengaged',
        ]);

        $applicantPool->load(['applicantProfile.user', 'position', 'hiringRound']);

        NotificationService::dispatch(
            $applicantPool->applicantProfile->user,
            'reengagement',
            'A New Opportunity Awaits',
            "We're reaching out about a new hiring round related to your previous application for {$applicantPool->position->title}.",
            new ReengagementEmail($applicantPool->position->title, $applicantPool->hiringRound->name),
        );

        return response()->json([
            'message' => 'Re-engagement email marked as sent.',
            'data'    => $applicantPool->fresh()->load([
                'applicantProfile.user:id,first_name,last_name,email',
                'position:id,title',
            ]),
        ]);
    }

    public function updateStatus(UpdatePoolStatusRequest $request, ApplicantPool $applicantPool): JsonResponse
    {
        $validated = $request->validated();

        $applicantPool->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Pool status updated successfully.',
            'data'    => $applicantPool->fresh(),
        ]);
    }

    public function myStatus(Request $request): JsonResponse
    {
        $applicantProfile = $request->user()->applicantProfile;

        if (!$applicantProfile) {
            return response()->json(['data' => []]);
        }

        $poolEntries = ApplicantPool::where('applicant_profile_id', $applicantProfile->id)
            ->with([
                'position:id,title',
                'hiringRound:id,name,semester,academic_year',
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($entry) => [
                'id'                   => $entry->id,
                'position_title'       => $entry->position->title ?? null,
                'hiring_round'         => $entry->hiringRound ? [
                    'name'             => $entry->hiringRound->name,
                    'semester'         => $entry->hiringRound->semester,
                    'academic_year'    => $entry->hiringRound->academic_year,
                ] : null,
                'pool_status'          => $entry->status,
                'reengagement_email_sent' => $entry->reengagement_email_sent,
                'confirmed_interest'   => $entry->confirmed_interest,
                'created_at'           => $entry->created_at->toIso8601String(),
            ]);

        return response()->json(['data' => $poolEntries]);
    }
}
