<?php


namespace App\Http\Controllers\Api;


use App\Http\Controllers\Concerns\ScopesToDirector;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCriterionRequest;
use App\Http\Requests\UpdateCriterionRequest;
use App\Models\Criterion;
use App\Models\Position;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;


class PositionCriterionController extends Controller
{
    use ScopesToDirector;

    public function index(Request $request, Position $position): JsonResponse
    {
        $this->assertDepartmentAccess($request->user(), $position->department_id);

        return response()->json($position->criteria()->with('options')->get());
    }


    public function store(StoreCriterionRequest $request, Position $position): JsonResponse
    {
        $validated = $request->validated();

        $this->ensureWeightDoesNotExceedOne($position, (float) $validated['weight']);

        $criterion = $position->criteria()->create($validated);

        return response()->json([
            'message' => 'Criterion created successfully.',
            'data' => $criterion->load('options'),
        ], 201);
    }


    public function show(Position $position, Criterion $criterion): JsonResponse
    {
        $this->assertBelongsToPosition($position, $criterion);


        return response()->json($criterion->load('options'));
    }


    public function update(UpdateCriterionRequest $request, Criterion $criterion): JsonResponse
    {
        $validated = $request->validated();

        if (array_key_exists('weight', $validated)) {
            $this->ensureWeightDoesNotExceedOne(
                $criterion->position,
                (float) $validated['weight'],
                $criterion
            );
        }

        $criterion->update($validated);

        return response()->json([
            'message' => 'Criterion updated successfully.',
            'data' => $criterion->fresh()->load('options'),
        ]);
    }


    public function destroy(Criterion $criterion): JsonResponse
    {
        $criterion->delete();


        return response()->json(['message' => 'Criterion deleted.']);
    }


    private function assertBelongsToPosition(Position $position, Criterion $criterion): void
    {
        if ($criterion->position_id !== $position->id) {
            abort(404);
        }
    }


    private function ensureWeightDoesNotExceedOne(Position $position, float $incomingWeight, ?Criterion $ignoreCriterion = null): void
    {
        $currentWeightSum = $position->criteria()
            ->when($ignoreCriterion, fn ($query) => $query->where('id', '!=', $ignoreCriterion->id))
            ->sum('weight');

        $newTotal = (float) $currentWeightSum + $incomingWeight;

        if ($newTotal > 1.0) {
            throw ValidationException::withMessages([
                'weight' => ['The total weight for this position cannot exceed 1.0.'],
            ]);
        }
    }
}



