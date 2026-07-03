<?php


namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCriterionOptionRequest;
use App\Http\Requests\UpdateCriterionOptionRequest;
use App\Models\Criterion;
use App\Models\CriterionOption;
use App\Models\Position;
use Illuminate\Http\JsonResponse;


class CriterionOptionController extends Controller
{
    public function index(Position $position, Criterion $criterion): JsonResponse
    {
        $this->assertBelongsToPosition($position, $criterion);


        return response()->json($criterion->options()->get());
    }


    public function store(StoreCriterionOptionRequest $request, Position $position, Criterion $criterion): JsonResponse
    {
        $this->assertBelongsToPosition($position, $criterion);
        $this->assertSelectableCriterion($criterion);


        $option = $criterion->options()->create($request->validated());


        return response()->json($option, 201);
    }


    public function show(Position $position, Criterion $criterion, CriterionOption $criterionOption): JsonResponse
    {
        $this->assertBelongsToPosition($position, $criterion);
        $this->assertBelongsToCriterion($criterion, $criterionOption);


        return response()->json($criterionOption);
    }


    public function update(UpdateCriterionOptionRequest $request, Position $position, Criterion $criterion, CriterionOption $criterionOption): JsonResponse
    {
        $this->assertBelongsToPosition($position, $criterion);
        $this->assertBelongsToCriterion($criterion, $criterionOption);
        $this->assertSelectableCriterion($criterion);


        $criterionOption->fill($request->validated());
        $criterionOption->save();


        return response()->json($criterionOption);
    }


    public function destroy(Position $position, Criterion $criterion, CriterionOption $criterionOption): JsonResponse
    {
        $this->assertBelongsToPosition($position, $criterion);
        $this->assertBelongsToCriterion($criterion, $criterionOption);


        $criterionOption->delete();


        return response()->json(['message' => 'Criterion option deleted.']);
    }


    private function assertBelongsToPosition(Position $position, Criterion $criterion): void
    {
        if ($criterion->position_id !== $position->id) {
            abort(404);
        }
    }


    private function assertBelongsToCriterion(Criterion $criterion, CriterionOption $criterionOption): void
    {
        if ($criterionOption->criterion_id !== $criterion->id) {
            abort(404);
        }
    }


    private function assertSelectableCriterion(Criterion $criterion): void
    {
        if ($criterion->data_type !== 'select') {
            abort(422, 'Criterion options are only allowed for select-type criteria.');
        }
    }
}



