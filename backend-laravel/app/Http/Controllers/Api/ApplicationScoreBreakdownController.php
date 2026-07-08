<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Application;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class ApplicationScoreBreakdownController extends Controller
{
    public function index(Request $request, Application $application): JsonResponse
    {
        // Check ownership/permissions if required, otherwise default roles (Admin/Director) handle authorization
        $breakdown = DB::table('v_wsm_score_breakdown')
            ->where('application_id', $application->id)
            ->get();
        return response()->json([
            'application_id' => $application->id,
            'total_wsm_score' => $application->total_wsm_score,
            'breakdown' => $breakdown,
        ]);
    }
}