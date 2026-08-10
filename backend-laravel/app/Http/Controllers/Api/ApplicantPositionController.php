<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\HiringRound;
use App\Models\Position;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class ApplicantPositionController extends Controller
{
    /**
     * Open positions this applicant is eligible for.
     * Eligibility follows target_applicant_type, so an external applicant
     * never sees internal-only postings.
     */
    public function index(Request $request): JsonResponse
    {
        $profile = $request->user()->applicantProfile;

        if (! $profile) {
            abort(422, 'Applicant profile not found for this user.');
        }

        $applications = $this->currentRoundApplications($profile->id);

        $positions = Position::with('department:id,name,code')
            ->withCount('criteria')
            ->where('status', 'open')
            ->whereIn('target_applicant_type', [$profile->applicant_type, 'both'])
            ->when($request->filled('department_id'), fn ($q) => $q->where('department_id', $request->input('department_id')))
            ->when($request->filled('search'), fn ($q) => $q->where('title', 'ilike', '%' . $request->input('search') . '%'))
            // A NULL deadline means none was set — those stay visible.
            ->when(! $request->boolean('include_expired'), fn ($q) => $q->where(
                fn ($inner) => $inner->whereNull('application_deadline')
                    ->orWhereDate('application_deadline', '>=', now()->toDateString())
            ))
            ->orderBy('application_deadline')
            ->get()
            ->map(fn ($position) => $this->transform($position, $applications->get($position->id)));

        return response()->json(['data' => $positions]);
    }

    public function show(Request $request, Position $position): JsonResponse
    {
        $profile = $request->user()->applicantProfile;

        if (! $profile) {
            abort(422, 'Applicant profile not found for this user.');
        }

        if ($position->status !== 'open'
            || ! in_array($position->target_applicant_type, [$profile->applicant_type, 'both'], true)) {
            abort(404);
        }

        $position->load('department:id,name,code')->loadCount('criteria');

        $existing = $this->currentRoundApplications($profile->id)->get($position->id);

        return response()->json([
            'data' => array_merge($this->transform($position, $existing), [
                'description' => $position->description,
            ]),
        ]);
    }

    /**
     * This applicant's applications in the round new applications attach to,
     * keyed by position. Scoped the same way ApplicationController@store picks a
     * round, so a position applied to in a previous round opens up again once a
     * new round starts rather than staying permanently marked as applied.
     */
    private function currentRoundApplications(string $profileId): Collection
    {
        $activeRound = HiringRound::where('status', 'active')->latest('start_date')->first();

        if (! $activeRound) {
            return collect();
        }

        return Application::where('applicant_profile_id', $profileId)
            ->where('hiring_round_id', $activeRound->id)
            ->get()
            ->keyBy('position_id');
    }

    private function transform(Position $position, ?Application $application): array
    {
        return [
            'id'                    => $position->id,
            'title'                 => $position->title,
            'description'           => $position->description,
            'department'            => $position->department ? [
                'id'   => $position->department->id,
                'name' => $position->department->name,
                'code' => $position->department->code,
            ] : null,
            'target_applicant_type' => $position->target_applicant_type,
            'slots_available'       => $position->slots_available,
            'slots_filled'          => $position->slots_filled,
            'status'                => $position->status,
            'application_deadline'  => $position->application_deadline?->toDateString(),
            'criteria_count'        => $position->criteria_count ?? 0,
            // A draft has not been submitted, so it must not read as applied --
            // the applicant still needs a way back into it.
            'has_applied'           => $application !== null && $application->status !== 'draft',
            'application_status'    => $application?->status,
            'application_id'        => $application?->id,
        ];
    }
}
