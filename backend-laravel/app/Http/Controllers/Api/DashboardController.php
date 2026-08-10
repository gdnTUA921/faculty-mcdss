<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToDirector;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\HiringRound;
use App\Models\Position;
use App\Models\StatusHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ScopesToDirector;

    /**
     * Dashboard counters for the admin and director home screens.
     * Directors get the same shape, scoped to the departments they lead.
     */
    public function stats(Request $request): JsonResponse
    {
        $departmentIds = $this->scopedDepartmentIds($request->user());

        $activeRound = HiringRound::where('status', 'active')->latest('start_date')->first();

        $positionQuery = Position::query();
        if ($departmentIds !== null) {
            $positionQuery->whereIn('department_id', $departmentIds);
        }

        $applicationQuery = fn () => Application::query()
            ->where('status', '!=', 'draft')
            ->when($activeRound, fn ($q) => $q->where('hiring_round_id', $activeRound->id))
            ->when($departmentIds !== null, fn ($q) => $q->whereHas(
                'position',
                fn ($p) => $p->whereIn('department_id', $departmentIds)
            ));

        $byStatus = $applicationQuery()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $statuses = ['applied', 'for_interview', 'for_review', 'hired', 'rejected', 'withdrawn'];
        $applicationsByStatus = [];
        foreach ($statuses as $status) {
            $applicationsByStatus[$status] = (int) ($byStatus[$status] ?? 0);
        }

        return response()->json([
            'data' => [
                'active_round' => $activeRound ? [
                    'id'            => $activeRound->id,
                    'name'          => $activeRound->name,
                    'semester'      => $activeRound->semester,
                    'academic_year' => $activeRound->academic_year,
                    'start_date'    => $activeRound->start_date?->toDateString(),
                    'end_date'      => $activeRound->end_date?->toDateString(),
                ] : null,
                'open_positions'    => (clone $positionQuery)->where('status', 'open')->count(),
                'total_positions'   => (clone $positionQuery)->count(),
                'total_slots'       => (int) (clone $positionQuery)->where('status', 'open')->sum('slots_available'),
                'filled_slots'      => (int) (clone $positionQuery)->sum('slots_filled'),
                // Distinct people, not applications — one applicant may apply to several positions.
                'total_applicants'  => $applicationQuery()->distinct('applicant_profile_id')->count('applicant_profile_id'),
                'total_applications' => $applicationQuery()->count(),
                'pending_reviews'   => $applicationQuery()->whereIn('status', ['applied', 'for_review', 'for_interview'])->count(),
                'hired_count'       => $applicationQuery()->where('status', 'hired')->count(),
                'scored_count'      => $applicationQuery()->whereNotNull('total_wsm_score')->count(),
                'pool_members'      => $applicationQuery()->where('is_pool_member', true)->count(),
                'applications_by_status' => $applicationsByStatus,
                'recent_activity'   => $this->recentActivity($departmentIds),
            ],
        ]);
    }

    private function recentActivity(?array $departmentIds): array
    {
        return StatusHistory::with([
            'application:id,applicant_profile_id,position_id',
            'application.applicantProfile:id,user_id',
            'application.applicantProfile.user:id,first_name,last_name',
            'application.position:id,title,department_id',
            'application.position.department:id,name,code',
            'changedBy:id,first_name,last_name',
        ])
            ->when($departmentIds !== null, fn ($q) => $q->whereHas(
                'application.position',
                fn ($p) => $p->whereIn('department_id', $departmentIds)
            ))
            ->orderByDesc('changed_at')
            ->limit(10)
            ->get()
            ->map(function ($entry) {
                $user     = $entry->application?->applicantProfile?->user;
                $position = $entry->application?->position;

                return [
                    'id'              => $entry->id,
                    'application_id'  => $entry->application_id,
                    'applicant_name'  => $user ? trim($user->first_name . ' ' . $user->last_name) : null,
                    'position'        => $position
                        ? $position->title . ' — ' . ($position->department->code ?? $position->department->name ?? '')
                        : null,
                    'previous_status' => $entry->previous_status,
                    'new_status'      => $entry->new_status,
                    'changed_by'      => $entry->changedBy
                        ? trim($entry->changedBy->first_name . ' ' . $entry->changedBy->last_name)
                        : null,
                    'timestamp'       => $entry->changed_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }
}
