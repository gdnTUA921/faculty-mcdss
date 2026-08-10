<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HiringRound;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class HiringRoundArchiveController extends Controller
{
    public function __invoke(HiringRound $hiringRound): JsonResponse
    {
        if ($hiringRound->status !== 'closed') {
            throw ValidationException::withMessages([
                'hiring_round' => ['Only a closed hiring round can be archived.'],
            ]);
        }

        $hiringRound->update(['status' => 'archived']);

        return response()->json([
            'message' => 'Hiring round archived.',
            'data'    => [
                'hiring_round_id' => $hiringRound->id,
                'status'          => 'archived',
            ],
        ]);
    }
}
