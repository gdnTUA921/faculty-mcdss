<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Concerns\ScopesToDirector;
use App\Http\Controllers\Controller;
use App\Models\Application;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class ApplicationScoreBreakdownController extends Controller
{
    use ScopesToDirector;

    public function index(Request $request, Application $application): JsonResponse
    {
        // Admins are unscoped; directors only reach applications in their departments.
        $application->load('position:id,department_id');
        $this->assertDepartmentAccess($request->user(), $application->position?->department_id);

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