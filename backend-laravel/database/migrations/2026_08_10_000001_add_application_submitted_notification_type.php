<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Adds 'application_submitted' to the notifications.type check constraint --
 * this is the director-facing counterpart to 'application_received', which only
 * ever notified the applicant.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE notifications DROP CONSTRAINT notifications_type_check');
        DB::statement(
            "ALTER TABLE notifications ADD CONSTRAINT notifications_type_check ".
            "CHECK (type IN ('application_received','status_change','pool_invitation',".
            "'account_created','reengagement','application_submitted'))"
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE notifications DROP CONSTRAINT notifications_type_check');
        DB::statement(
            "ALTER TABLE notifications ADD CONSTRAINT notifications_type_check ".
            "CHECK (type IN ('application_received','status_change','pool_invitation',".
            "'account_created','reengagement'))"
        );
    }
};
