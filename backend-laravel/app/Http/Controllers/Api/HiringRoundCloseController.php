<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PoolInvitation;
use App\Models\Application;
use App\Models\ApplicantPool;
use App\Models\HiringRound;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class HiringRoundCloseController extends Controller
{
    public function __invoke(HiringRound $hiringRound): JsonResponse
    {
        if ($hiringRound->status !== 'active') {
            throw ValidationException::withMessages([
                'hiring_round' => ['This hiring round is not currently active and cannot be closed.'],
            ]);
        }

        $unhiredApplications = Application::where('hiring_round_id', $hiringRound->id)
            ->whereIn('status', ['applied', 'for_interview', 'for_review', 'rejected', 'withdrawn'])
            ->get();

        $created = 0;

        foreach ($unhiredApplications as $application) {
            $poolEntry = ApplicantPool::firstOrCreate(
                [
                    'applicant_profile_id' => $application->applicant_profile_id,
                    'hiring_round_id'      => $hiringRound->id,
                    'position_id'          => $application->position_id,
                ],
                [
                    'status' => 'active',
                ]
            );

            if ($poolEntry->wasRecentlyCreated) {
                $created++;

                NotificationService::dispatch(
                    $application->applicantProfile->user,
                    'pool_invitation',
                    "You've Been Added to Our Applicant Pool",
                    "You've been added to the applicant pool for {$application->position->title} after the {$hiringRound->name} round closed.",
                    new PoolInvitation($application->position->title, $hiringRound->name),
                    $application->id,
                );
            }

            $application->update([
                'is_pool_member' => true,
                'pool_status'    => 'active',
            ]);
        }

        $hiringRound->update(['status' => 'closed']);

        return response()->json([
            'message' => "Hiring round closed. {$created} applicant(s) moved to pool.",
            'data'    => [
                'hiring_round_id'      => $hiringRound->id,
                'status'               => 'closed',
                'pool_entries_created' => $created,
                'total_unhired'        => $unhiredApplications->count(),
            ],
        ]);
    }
}
