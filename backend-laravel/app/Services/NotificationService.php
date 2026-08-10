<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class NotificationService
{
    /**
     * In-app-only notification, fanned out to many recipients as a single insert.
     * dispatch() does one round trip per recipient, which is fine for the "one
     * applicant, one director" case but doesn't belong in a loop over every admin
     * as that role list grows.
     */
    public static function dispatchInAppToMany(
        Collection|array $recipients,
        string $type,
        string $subject,
        string $body,
        ?string $applicationId = null,
    ): void {
        $recipients = collect($recipients);

        if ($recipients->isEmpty()) {
            return;
        }

        $now = now();

        Notification::insert(
            $recipients
                ->map(fn (User $recipient) => [
                    // Bulk insert bypasses HasUuids, so generate the same UUIDv7 it
                    // would have -- keeps IDs time-ordered like every other table.
                    'id'              => (string) Str::uuid7(),
                    'user_id'         => $recipient->id,
                    'application_id'  => $applicationId,
                    'type'            => $type,
                    'subject'         => $subject,
                    'body'            => $body,
                    'channel'         => 'in_app',
                    'delivery_status' => 'sent',
                    'sent_at'         => $now,
                    'created_at'      => $now,
                ])
                ->all(),
        );
    }

    public static function dispatch(
        User $recipient,
        string $type,
        string $subject,
        string $body,
        ?Mailable $mailable = null,
        ?string $applicationId = null,
    ): Notification {
        $notification = Notification::create([
            'user_id'         => $recipient->id,
            'application_id'  => $applicationId,
            'type'            => $type,
            'subject'         => $subject,
            'body'            => $body,
            'channel'         => $mailable === null ? 'in_app' : 'email',
            'delivery_status' => 'pending',
        ]);

        if ($mailable === null) {
            // In-app delivery is just the row existing — nothing async to wait on,
            // so mark it delivered immediately rather than leaving it "pending" forever.
            $notification->update(['delivery_status' => 'sent', 'sent_at' => now()]);

            return $notification->fresh();
        }

        try {
            Mail::to($recipient->email)->send($mailable);

            $notification->update([
                'delivery_status' => 'sent',
                'sent_at'         => now(),
            ]);
        } catch (Throwable $e) {
            $notification->update(['delivery_status' => 'failed']);

            Log::error('NotificationService: failed to send email', [
                'notification_id' => $notification->id,
                'type'             => $type,
                'recipient'        => $recipient->email,
                'error'            => $e->getMessage(),
            ]);
        }

        return $notification->fresh();
    }
}
