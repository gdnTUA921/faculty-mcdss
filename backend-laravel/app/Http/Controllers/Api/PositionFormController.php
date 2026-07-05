<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Position;
use Illuminate\Http\JsonResponse;

class PositionFormController extends Controller
{
    public function show(Position $position): JsonResponse
    {
        $criteria = $position->criteria()->with('options')->get();

        $fields = $criteria->map(fn ($criterion) => [
            'criterion_id' => $criterion->id,
            'name' => $criterion->name,
            'description' => $criterion->description,
            'data_type' => $criterion->data_type,
            'is_required' => $criterion->is_required,
            'min_value' => $criterion->min_value,
            'max_value' => $criterion->max_value,
            'options' => $criterion->data_type === 'select'
                ? $criterion->options->map(fn ($option) => [
                    'id' => $option->id,
                    'label' => $option->label,
                    'value' => $option->value,
                ])->values()
                : [],
        ]);

        return response()->json([
            'position' => [
                'id' => $position->id,
                'title' => $position->title,
                'description' => $position->description,
                'target_applicant_type' => $position->target_applicant_type,
                'status' => $position->status,
            ],
            'fields' => $fields,
        ]);
    }
}
