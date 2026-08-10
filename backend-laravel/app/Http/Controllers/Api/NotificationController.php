<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Notification::where('user_id', $request->user()->id);

        if ($request->boolean('unread_only')) {
            $query->whereNull('read_at');
        }

        // created_at is timestamp(0), so notifications raised in the same second tie and
        // Postgres returns them in arbitrary order. The UUIDv7 primary key is
        // time-ordered at millisecond precision, so it breaks the tie deterministically.
        $notifications = (clone $query)
            ->orderByRaw('read_at IS NULL DESC')
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'data' => $notifications,
            'meta' => [
                'total'        => $notifications->count(),
                'unread_count' => Notification::where('user_id', $request->user()->id)
                    ->whereNull('read_at')
                    ->count(),
            ],
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $updated = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'message'       => 'All notifications marked as read.',
            'updated_count' => $updated,
        ]);
    }

    public function markRead(Request $request, Notification $notification): JsonResponse
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(404);
        }

        $notification->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Notification marked as read.',
            'data'    => $notification->fresh(),
        ]);
    }
}
