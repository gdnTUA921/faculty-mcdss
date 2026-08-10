<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('application_id')->nullable()->constrained('applications')->nullOnDelete();
            $table->enum('type', ['application_received', 'status_change', 'pool_invitation', 'account_created', 'reengagement']);
            $table->string('subject', 255);
            $table->text('body');
            $table->enum('channel', ['email', 'in_app'])->default('email');
            $table->enum('delivery_status', ['pending', 'sent', 'failed'])->default('pending');
            $table->timestampTz('sent_at')->nullable();
            $table->timestampTz('read_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });

        DB::statement('CREATE INDEX idx_notifications_user ON notifications (user_id)');
        DB::statement('CREATE INDEX idx_notifications_user_read ON notifications (user_id, read_at)');
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
