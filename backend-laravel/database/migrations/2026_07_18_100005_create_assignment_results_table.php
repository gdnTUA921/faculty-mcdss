<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignment_results', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('assignment_run_id')->constrained('assignment_runs')->cascadeOnDelete();
            $table->foreignUuid('application_id')->constrained('applications')->restrictOnDelete();
            $table->foreignUuid('position_id')->constrained('positions')->restrictOnDelete();
            $table->boolean('is_assigned');
            $table->decimal('objective_score', 8, 4)->nullable();
            $table->text('notes')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['assignment_run_id', 'application_id'], 'uq_run_application');
        });

        DB::statement('CREATE INDEX idx_assignment_results_run ON assignment_results (assignment_run_id)');
        DB::statement('CREATE INDEX idx_assignment_results_application ON assignment_results (application_id)');
        DB::statement('CREATE INDEX idx_assignment_results_assigned ON assignment_results (assignment_run_id, is_assigned) WHERE is_assigned = TRUE');
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_results');
    }
};
