<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('status_history', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('application_id')->constrained('applications')->cascadeOnDelete();
            $table->enum('previous_status', ['draft', 'applied', 'for_interview', 'for_review', 'hired', 'rejected', 'withdrawn'])->nullable();
            $table->enum('new_status', ['draft', 'applied', 'for_interview', 'for_review', 'hired', 'rejected', 'withdrawn'])->nullable(false);
            $table->text('notes')->nullable();
            $table->foreignUuid('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('changed_at')->useCurrent();
        });

        DB::statement('CREATE INDEX idx_status_history_application ON status_history (application_id)');
        DB::statement('CREATE INDEX idx_status_history_changed_at ON status_history (changed_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('status_history');
    }
};
