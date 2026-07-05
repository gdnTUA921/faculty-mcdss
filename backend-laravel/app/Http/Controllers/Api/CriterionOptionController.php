<?php


namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCriterionOptionRequest;
use App\Http\Requests\UpdateCriterionOptionRequest;
use App\Models\Criterion;
use App\Models\CriterionOption;
use Illuminate\Http\JsonResponse;


class CriterionOptionController extends Controller
{
    public function index(Criterion $criterion): JsonResponse
    {
        return response()->json($criterion->options()->get());
    }


    public function store(StoreCriterionOptionRequest $request, Criterion $criterion): JsonResponse
    {
        $this->assertSelectableCriterion($criterion);


        $option = $criterion->options()->create($request->validated());


        return response()->json($option, 201);
    }


    public function show(CriterionOption $criterionOption): JsonResponse
    {
        return response()->json($criterionOption);
    }


    public function update(UpdateCriterionOptionRequest $request, CriterionOption $criterionOption): JsonResponse
    {
        $this->assertSelectableCriterion($criterionOption->criterion);


        $criterionOption->fill($request->validated());
        $criterionOption->save();


        return response()->json($criterionOption);
    }


    public function destroy(CriterionOption $criterionOption): JsonResponse
    {
        $criterionOption->delete();


        return response()->json(['message' => 'Criterion option deleted.']);
    }


    private function assertSelectableCriterion(Criterion $criterion): void
    {
        if ($criterion->data_type !== 'select') {
            abort(422, 'Criterion options are only allowed for select-type criteria.');
        }
    }
}



