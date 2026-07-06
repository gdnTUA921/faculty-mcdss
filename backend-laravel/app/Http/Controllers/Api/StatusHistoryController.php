<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use Illuminate\Http\JsonResponse;

class StatusHistoryController extends Controller
{
    public function __invoke(Application $application): JsonResponse
    {
        $history = $application->statusHistory()
            ->with('changedBy:id,first_name,last_name,email')
            ->orderBy('changed_at', 'asc')
            ->get()
            ->map(fn ($entry) => [
                'id'              => $entry->id,
                'previous_status' => $entry->previous_status,
                'new_status'      => $entry->new_status,
                'notes'           => $entry->notes,
                'changed_by'      => $entry->changedBy ? [
                    'id'         => $entry->changedBy->id,
                    'first_name' => $entry->changedBy->first_name,
                    'last_name'  => $entry->changedBy->last_name,
                    'email'      => $entry->changedBy->email,
                ] : null,
                'changed_at'      => $entry->changed_at->toIso8601String(),
            ]);

        return response()->json([
            'data' => $history,
        ]);
    }
}
