<?php

namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Http\Requests\StorePositionRequest;
use App\Http\Requests\UpdatePositionRequest;
use App\Models\Position;
use Illuminate\Http\JsonResponse;


class PositionController extends Controller
{
    public function index(): JsonResponse
    {
        $positions = Position::with(['department', 'creator'])
            ->withCount('criteria')
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


    public function show(Position $position): JsonResponse
    {
        return response()->json(
            $position->load(['department', 'creator', 'criteria.options'])->loadCount('criteria')
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
