<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssignmentRunRequest;
use App\Models\AssignmentRun;
use App\Models\AssignmentResult;
use App\Services\AssignmentSolverService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

    /**
     * Run history, newest first. The assignment screen loads this to find the
     * latest completed run without already knowing its ID.
     */
    public function index(Request $request): JsonResponse
    {
        $runs = AssignmentRun::with(['hiringRound:id,name,semester,academic_year', 'runner:id,first_name,last_name'])
            ->withCount(['results as assigned_count' => fn ($q) => $q->where('is_assigned', true)])
            ->when($request->filled('hiring_round_id'), fn ($q) => $q->where('hiring_round_id', $request->input('hiring_round_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->orderByDesc('run_at')
            ->limit(min((int) $request->input('limit', 25), 100))
            ->get()
            ->map(fn ($run) => [
                'id'                   => $run->id,
                'hiring_round'         => $run->hiringRound ? [
                    'id'            => $run->hiringRound->id,
                    'name'          => $run->hiringRound->name,
                    'semester'      => $run->hiringRound->semester,
                    'academic_year' => $run->hiringRound->academic_year,
                ] : null,
                'scope_applicant_type' => $run->scope_applicant_type,
                'status'               => $run->status,
                'result_summary'       => $run->result_summary,
                'assigned_count'       => $run->assigned_count,
                'run_by'               => $run->runner
                    ? trim($run->runner->first_name . ' ' . $run->runner->last_name)
                    : null,
                'run_at'               => $run->run_at?->toIso8601String(),
                'completed_at'         => $run->completed_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $runs]);
    }

    public function show(AssignmentRun $assignmentRun): JsonResponse
    {
        // Phase 7 keys are unchanged; the deeper eager loads add the applicant
        // and position detail the results table needs to render names.
        $assignmentRun->load([
            'hiringRound',
            'runner',
            'results.application.applicantProfile.user:id,first_name,last_name,email',
            'results.application.applicantProfile:id,user_id,applicant_type',
            'results.position:id,title,department_id',
            'results.position.department:id,name,code',
        ]);

        return response()->json($assignmentRun);
    }
}