<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Position;
use App\Services\WsmScoringService;
use Illuminate\Http\JsonResponse;
class PositionScoringController extends Controller
{
    public function __construct(private readonly WsmScoringService $scoringService)
    {
    }
    public function __invoke(Position $position): JsonResponse
    {
        $this->scoringService->scorePositionApplications($position);
        return response()->json([
            'message' => 'Scoring and WSM calculations completed for ' . $position->title,
        ]);
    }
}