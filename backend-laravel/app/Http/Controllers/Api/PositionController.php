<?php

namespace App\Http\Controllers\Api;


use App\Http\Controllers\Concerns\ScopesToDirector;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePositionRequest;
use App\Http\Requests\UpdatePositionRequest;
use App\Models\Position;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class PositionController extends Controller
{
    use ScopesToDirector;

    public function index(Request $request): JsonResponse
    {
        $departmentIds = $this->scopedDepartmentIds($request->user());

        $positions = Position::with(['department', 'creator'])
            ->withCount('criteria')
            ->withCount(['applications' => fn ($q) => $q->where('status', '!=', 'draft')])
            ->when($departmentIds !== null, fn ($q) => $q->whereIn('department_id', $departmentIds))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('department_id'), fn ($q) => $q->where('department_id', $request->input('department_id')))
            ->when($request->filled('search'), fn ($q) => $q->where('title', 'ilike', '%' . $request->input('search') . '%'))
            ->orderBy('title')
            ->get();


        return response()->json($positions);
    }


    public function store(StorePositionRequest $request): JsonResponse
    {
        $position = Position::create(array_merge(
            $request->validated(),
            ['created_by' => $request->user()->id],
        ));


        return response()->json($position->load(['department', 'creator'])->loadCount('criteria'), 201);
    }


    public function show(Request $request, Position $position): JsonResponse
    {
        $this->assertDepartmentAccess($request->user(), $position->department_id);

        return response()->json(
            $position->load(['department', 'creator', 'criteria.options'])
                ->loadCount('criteria')
                ->loadCount(['applications' => fn ($q) => $q->where('status', '!=', 'draft')])
        );
    }


    public function update(UpdatePositionRequest $request, Position $position): JsonResponse
    {
        $position->fill($request->validated());
        $position->save();


        return response()->json($position->load(['department', 'creator'])->loadCount('criteria'));
    }


    public function destroy(Position $position): JsonResponse
    {
        $position->delete();


        return response()->json(['message' => 'Position deleted.']);
    }
}
