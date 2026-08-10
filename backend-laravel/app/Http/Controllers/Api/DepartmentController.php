<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToDirector;
use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    use ScopesToDirector;

    public function index(Request $request): JsonResponse
    {
        $departmentIds = $this->scopedDepartmentIds($request->user());

        $departments = Department::with('director:id,first_name,last_name,email')
            ->withCount(['positions' => fn ($q) => $q->where('status', 'open')])
            ->when($departmentIds !== null, fn ($q) => $q->whereIn('id', $departmentIds))
            ->when($request->boolean('active_only'), fn ($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get()
            ->map(fn ($department) => [
                'id'                  => $department->id,
                'name'                => $department->name,
                'code'                => $department->code,
                'description'         => $department->description,
                'is_active'           => $department->is_active,
                'open_positions_count' => $department->positions_count,
                'director'            => $department->director ? [
                    'id'         => $department->director->id,
                    'first_name' => $department->director->first_name,
                    'last_name'  => $department->director->last_name,
                    'full_name'  => trim($department->director->first_name . ' ' . $department->director->last_name),
                    'email'      => $department->director->email,
                ] : null,
            ]);

        return response()->json(['data' => $departments]);
    }
}
