<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignment_runs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('hiring_round_id')->constrained('hiring_rounds')->restrictOnDelete();
            $table->enum('scope_applicant_type', ['external', 'internal', 'both'])->nullable();
            $table->jsonb('scope_position_ids')->nullable();
            $table->jsonb('scope_department_ids')->nullable();
            $table->jsonb('ilp_parameters')->nullable();
            $table->enum('status', ['pending', 'running', 'completed', 'failed'])->default('pending');
            $table->jsonb('result_summary')->nullable();
            $table->timestampTz('run_at')->useCurrent();
            $table->timestampTz('completed_at')->nullable();
            $table->foreignUuid('run_by')->nullable()->constrained('users')->nullOnDelete();
        });

        DB::statement('CREATE INDEX idx_assignment_runs_round ON assignment_runs (hiring_round_id)');
        DB::statement('CREATE INDEX idx_assignment_runs_status ON assignment_runs (status)');
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_runs');
    }
};
