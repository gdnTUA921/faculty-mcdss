<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Position;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
class PositionRankingController extends Controller
{
    public function index(Position $position): JsonResponse
    {
        // Query the ranking view, filtering out drafts
        $rankings = DB::table('v_applicant_rankings')
            ->where('position_id', $position->id)
            ->where('status', '!=', 'draft')
            ->orderBy('rank_in_position')
            ->get();
        return response()->json($rankings);
    }
}