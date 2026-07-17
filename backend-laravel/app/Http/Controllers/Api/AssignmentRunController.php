<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssignmentRunRequest;
use App\Models\AssignmentRun;
use App\Models\AssignmentResult;
use App\Services\AssignmentSolverService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class AssignmentRunController extends Controller
{
    public function __construct(private readonly AssignmentSolverService $assignmentSolver)
    {
    }

    public function store(StoreAssignmentRunRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $assignmentRun = AssignmentRun::create([
            'hiring_round_id' => $validated['hiring_round_id'],
            'scope_applicant_type' => $validated['scope_applicant_type'],
            'scope_position_ids' => $validated['scope_position_ids'] ?? null,
            'scope_department_ids' => $validated['scope_department_ids'] ?? null,
            'ilp_parameters' => [
                'objective' => 'maximize_total_wsm_score',
                'solver' => 'cbc',
            ],
            'status' => 'pending',
            'run_at' => now(),
            'run_by' => $request->user()->id,
        ]);

        try {
            $solverResponse = $this->assignmentSolver->run($validated);

            DB::transaction(function () use ($assignmentRun, $solverResponse): void {
                foreach ($solverResponse['results'] ?? [] as $result) {
                    AssignmentResult::create([
                        'assignment_run_id' => $assignmentRun->id,
                        'application_id' => $result['application_id'],
                        'position_id' => $result['position_id'],
                        'is_assigned' => $result['is_assigned'],
                        'objective_score' => $result['objective_score'],
                    ]);
                }

                $assignmentRun->update([
                    'status' => 'completed',
                    'result_summary' => [
                        'objective_score' => $solverResponse['objective_score'] ?? 0,
                        'assigned_count' => $solverResponse['assigned_count'] ?? 0,
                        'candidate_count' => $solverResponse['candidate_count'] ?? 0,
                    ],
                    'completed_at' => now(),
                ]);
            });

            return response()->json([
                'message' => 'Assignment run completed.',
                'assignment_run' => $assignmentRun->load('results'),
            ], 201);
        } catch (Throwable $exception) {
            $assignmentRun->update([
                'status' => 'failed',
                'result_summary' => [
                    'error' => $exception->getMessage(),
                ],
                'completed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Assignment run failed.',
            ], 502);
        }
    }

    public function show(AssignmentRun $assignmentRun): JsonResponse
    {
        return response()->json(
            $assignmentRun->load(['results', 'hiringRound', 'runner'])
        );
    }
}