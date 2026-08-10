<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToDirector;
use App\Http\Controllers\Controller;
use App\Models\Application;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminApplicationController extends Controller
{
    use ScopesToDirector;

    private const RELATIONS = [
        'applicantProfile:id,user_id,applicant_type,institution_email,profile_completed_at',
        'applicantProfile.user:id,first_name,last_name,email,phone,created_at',
        'position:id,title,department_id',
        'position.department:id,name,code',
        'hiringRound:id,name,semester,academic_year',
    ];

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 25), 200);

        $paginator = $this->filteredQuery($request)
            ->with(self::RELATIONS)
            ->paginate($perPage > 0 ? $perPage : 25);

        return response()->json([
            'data' => collect($paginator->items())->map(fn ($application) => $this->summary($application))->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(Request $request, Application $application): JsonResponse
    {
        $application->load(array_merge(self::RELATIONS, [
            'formResponses.criterion:id,name,data_type,weight',
            'documents:id,application_id,document_type,file_name,mime_type,file_size_bytes,is_verified,uploaded_at',
            'statusHistory.changedBy:id,first_name,last_name',
        ]));

        $this->assertDepartmentAccess($request->user(), $application->position?->department_id);

        $profile = $application->applicantProfile;
        $user    = $profile?->user;

        return response()->json([
            'data' => array_merge($this->summary($application), [
                'summary'            => $profile?->summary,
                'parsed_resume_data' => $profile?->parsed_resume_data,
                'account_created_at' => $user?->created_at?->toIso8601String(),
                'responses'          => $application->formResponses->map(fn ($response) => [
                    'id'           => $response->id,
                    'criterion_id' => $response->criterion_id,
                    'criterion'    => $response->criterion ? [
                        'id'     => $response->criterion->id,
                        'name'   => $response->criterion->name,
                        'type'   => $response->criterion->data_type,
                        'weight' => $response->criterion->weight,
                    ] : null,
                    'raw_value'         => $response->raw_value,
                    'normalized_score'  => $response->normalized_score,
                    'weighted_score'    => $response->weighted_score,
                    'responded_at'      => $response->responded_at?->toIso8601String(),
                ])->values(),
                'documents' => $application->documents->map(fn ($document) => [
                    'id'              => $document->id,
                    'document_type'   => $document->document_type,
                    'file_name'       => $document->file_name,
                    'mime_type'       => $document->mime_type,
                    'file_size_bytes' => $document->file_size_bytes,
                    'is_verified'     => $document->is_verified,
                    'uploaded_at'     => $document->uploaded_at?->toIso8601String(),
                ])->values(),
                'status_history' => $application->statusHistory
                    ->sortByDesc('changed_at')
                    ->map(fn ($entry) => [
                        'id'              => $entry->id,
                        'previous_status' => $entry->previous_status,
                        'new_status'      => $entry->new_status,
                        'notes'           => $entry->notes,
                        'changed_by'      => $entry->changedBy
                            ? trim($entry->changedBy->first_name . ' ' . $entry->changedBy->last_name)
                            : null,
                        'changed_at'      => $entry->changed_at?->toIso8601String(),
                    ])->values(),
            ]),
        ]);
    }

    /**
     * CSV export of the same filtered set the table shows.
     * Streamed so large hiring rounds do not build the whole file in memory.
     */
    public function export(Request $request): StreamedResponse
    {
        $query = $this->filteredQuery($request)->with(self::RELATIONS);

        $filename = 'applicants-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function () use ($query): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Application ID',
                'First Name',
                'Last Name',
                'Email',
                'Phone',
                'Applicant Type',
                'Department',
                'Position',
                'Hiring Round',
                'Status',
                'WSM Score',
                'Applied At',
                'Status Updated At',
            ]);

            $query->chunk(500, function ($applications) use ($handle): void {
                foreach ($applications as $application) {
                    $user = $application->applicantProfile?->user;

                    fputcsv($handle, [
                        $application->id,
                        $user?->first_name,
                        $user?->last_name,
                        $user?->email,
                        $user?->phone,
                        $application->applicantProfile?->applicant_type,
                        $application->position?->department?->name,
                        $application->position?->title,
                        $application->hiringRound?->name,
                        $application->status,
                        $application->total_wsm_score,
                        $application->applied_at?->toDateTimeString(),
                        $application->status_updated_at?->toDateTimeString(),
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Shared filter pipeline for index() and export() so the CSV always
     * matches what the table is showing.
     */
    private function filteredQuery(Request $request): Builder
    {
        $query = Application::query();

        // Drafts are the applicant's private workspace — HR only sees submitted work.
        if (! $request->boolean('include_drafts')) {
            $query->where('status', '!=', 'draft');
        }

        $departmentIds = $this->scopedDepartmentIds($request->user());

        if ($departmentIds !== null) {
            $query->whereHas('position', fn ($q) => $q->whereIn('department_id', $departmentIds));
        }

        if ($request->filled('status')) {
            $query->whereIn('status', array_map('trim', explode(',', $request->input('status'))));
        }

        if ($request->filled('position_id')) {
            $query->where('position_id', $request->input('position_id'));
        }

        if ($request->filled('hiring_round_id')) {
            $query->where('hiring_round_id', $request->input('hiring_round_id'));
        }

        if ($request->filled('department_id')) {
            $query->whereHas('position', fn ($q) => $q->where('department_id', $request->input('department_id')));
        }

        if ($request->filled('applicant_type')) {
            $query->whereHas('applicantProfile', fn ($q) => $q->where('applicant_type', $request->input('applicant_type')));
        }

        if ($request->filled('min_score')) {
            $query->where('total_wsm_score', '>=', (float) $request->input('min_score'));
        }

        if ($request->filled('search')) {
            $term = '%' . $request->input('search') . '%';

            $query->whereHas('applicantProfile.user', function ($q) use ($term): void {
                $q->where('first_name', 'ilike', $term)
                    ->orWhere('last_name', 'ilike', $term)
                    ->orWhere('email', 'ilike', $term);
            });
        }

        $sortable  = ['applied_at', 'total_wsm_score', 'status', 'status_updated_at'];
        $sortBy    = in_array($request->input('sort_by'), $sortable, true) ? $request->input('sort_by') : 'applied_at';
        $direction = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        // Postgres sorts NULLs first on DESC, which would float unscored applications
        // to the top of a score-ranked table. Unranked rows always belong at the bottom.
        // $sortBy is whitelisted above, so interpolating it here is safe.
        //
        // The id tiebreaker keeps pagination stable: applied_at is timestamp(0), so ties
        // are common and an unstable sort would repeat or drop rows between pages.
        return $query
            ->orderByRaw("{$sortBy} {$direction} NULLS LAST")
            ->orderBy('id', 'desc');
    }

    private function summary(Application $application): array
    {
        $profile = $application->applicantProfile;
        $user    = $profile?->user;

        return [
            'id'        => $application->id,
            'applicant' => $profile ? [
                'id'                => $profile->id,
                'user_id'           => $profile->user_id,
                'first_name'        => $user?->first_name,
                'last_name'         => $user?->last_name,
                'full_name'         => $user ? trim($user->first_name . ' ' . $user->last_name) : null,
                'email'             => $user?->email,
                'phone'             => $user?->phone,
                'applicant_type'    => $profile->applicant_type,
                'institution_email' => $profile->institution_email,
                'profile_completed' => $profile->profile_completed_at !== null,
            ] : null,
            'position' => $application->position ? [
                'id'         => $application->position->id,
                'title'      => $application->position->title,
                'department' => $application->position->department ? [
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
            'total_wsm_score'   => $application->total_wsm_score,
            'is_pool_member'    => $application->is_pool_member,
            'applied_at'        => $application->applied_at?->toIso8601String(),
            'status_updated_at' => $application->status_updated_at?->toIso8601String(),
        ];
    }
}
