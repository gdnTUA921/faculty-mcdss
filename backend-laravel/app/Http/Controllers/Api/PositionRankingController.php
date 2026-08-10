<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Concerns\ScopesToDirector;
use App\Http\Controllers\Controller;
use App\Models\Position;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class PositionRankingController extends Controller
{
    use ScopesToDirector;

    public function index(Request $request, Position $position): JsonResponse
    {
        $this->assertDepartmentAccess($request->user(), $position->department_id);

        // Query the ranking view, filtering out drafts
        $rankings = DB::table('v_applicant_rankings')
            ->where('position_id', $position->id)
            ->where('status', '!=', 'draft')
            ->orderBy('rank_in_position')
            ->get();
        return response()->json($rankings);
    }
}