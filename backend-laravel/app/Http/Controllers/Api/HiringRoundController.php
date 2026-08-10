<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHiringRoundRequest;
use App\Http\Requests\UpdateHiringRoundRequest;
use App\Models\HiringRound;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class HiringRoundController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rounds = HiringRound::withCount(['applications' => fn ($q) => $q->where('status', '!=', 'draft')])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->orderByDesc('start_date')
            ->get()
            ->map(fn ($round) => $this->transform($round));

        return response()->json(['data' => $rounds]);
    }

    public function store(StoreHiringRoundRequest $request): JsonResponse
    {
        $round = HiringRound::create(array_merge(
            $request->validated(),
            ['created_by' => $request->user()->id],
        ));

        // created_at is filled by a database default, so re-read it for the response.
        return response()->json([
            'message' => 'Hiring round created successfully.',
            'data'    => $this->transform($round->fresh()->loadCount('applications')),
        ], 201);
    }

    public function show(HiringRound $hiringRound): JsonResponse
    {
        return response()->json([
            'data' => $this->transform(
                $hiringRound->loadCount(['applications' => fn ($q) => $q->where('status', '!=', 'draft')])
            ),
        ]);
    }

    public function update(UpdateHiringRoundRequest $request, HiringRound $hiringRound): JsonResponse
    {
        // Closed and archived rounds back historical applications and pool entries;
        // relabelling them after the fact would misrepresent those records.
        if ($hiringRound->status !== 'active') {
            throw ValidationException::withMessages([
                'hiring_round' => ['Only an active hiring round can be edited.'],
            ]);
        }

        $hiringRound->fill($request->validated());
        $hiringRound->save();

        return response()->json([
            'message' => 'Hiring round updated successfully.',
            'data'    => $this->transform(
                $hiringRound->fresh()->loadCount(['applications' => fn ($q) => $q->where('status', '!=', 'draft')])
            ),
        ]);
    }

    private function transform(HiringRound $round): array
    {
        return [
            'id'                 => $round->id,
            'name'               => $round->name,
            'semester'           => $round->semester,
            'academic_year'      => $round->academic_year,
            'start_date'         => $round->start_date?->toDateString(),
            'end_date'           => $round->end_date?->toDateString(),
            'status'             => $round->status,
            'applications_count' => $round->applications_count ?? 0,
            'created_at'         => $round->created_at?->toIso8601String(),
        ];
    }
}
