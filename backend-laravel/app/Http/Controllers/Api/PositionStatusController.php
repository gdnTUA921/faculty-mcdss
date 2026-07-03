<?php


namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePositionStatusRequest;
use App\Models\Position;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;


class PositionStatusController extends Controller
{
    public function __invoke(UpdatePositionStatusRequest $request, Position $position): JsonResponse
    {
        $validated = $request->validated();

        if ($validated['status'] === 'open') {
            $totalWeight = (float) $position->criteria()->sum('weight');

            if (abs($totalWeight - 1.0) > 0.0001) {
                throw ValidationException::withMessages([
                    'status' => ['Position weights must total 1.0 before opening.'],
                ]);
            }
        }

        $position->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Position status updated successfully.',
            'data' => $position->fresh(),
        ]);
    }


    private function ensurePositionCanOpen(Position $position): void
    {
        if ($position->criteria()->count() === 0) {
            throw ValidationException::withMessages([
                'status' => ['A position must have at least one criterion before it can be opened.'],
            ]);
        }


        $totalWeight = round((float) $position->criteria()->sum('weight'), 4);


        if (abs($totalWeight - 1.0) > 0.0001) {
            throw ValidationException::withMessages([
                'status' => ['The criteria weights for this position must sum to exactly 1.0 before opening it.'],
            ]);
        }
    }
}
