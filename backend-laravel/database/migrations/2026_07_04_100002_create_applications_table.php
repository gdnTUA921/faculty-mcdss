<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('applicant_profile_id')->constrained('applicant_profiles')->cascadeOnDelete();
            $table->foreignUuid('position_id')->constrained('positions')->restrictOnDelete();
            $table->foreignUuid('hiring_round_id')->constrained('hiring_rounds')->restrictOnDelete();
            $table->enum('status', ['draft', 'applied', 'for_interview', 'for_review', 'hired', 'rejected', 'withdrawn'])->default('applied');
            $table->decimal('total_wsm_score', 8, 4)->nullable();
            $table->boolean('is_pool_member')->default(false);
            $table->enum('pool_status', ['active', 'inactive', 'reengaged', 'expired'])->nullable();
            $table->timestampTz('applied_at')->useCurrent();
            $table->timestampTz('status_updated_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['applicant_profile_id', 'position_id', 'hiring_round_id'], 'uq_application');
        });

        DB::statement('ALTER TABLE applications ADD CONSTRAINT chk_applications_wsm_score CHECK (total_wsm_score IS NULL OR (total_wsm_score >= 0 AND total_wsm_score <= 1))');
        DB::statement('CREATE INDEX idx_applications_profile ON applications (applicant_profile_id)');
        DB::statement('CREATE INDEX idx_applications_position_status ON applications (position_id, status)');
        DB::statement('CREATE INDEX idx_applications_round ON applications (hiring_round_id)');
        DB::statement('CREATE INDEX idx_applications_wsm_score ON applications (total_wsm_score DESC)');
        DB::statement('CREATE INDEX idx_applications_pool ON applications (is_pool_member) WHERE is_pool_member = TRUE');
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
