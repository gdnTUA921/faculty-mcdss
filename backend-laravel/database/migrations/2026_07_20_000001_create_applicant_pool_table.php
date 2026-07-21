<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applicant_pool', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('applicant_profile_id')->constrained('applicant_profiles')->cascadeOnDelete();
            $table->foreignUuid('hiring_round_id')->constrained('hiring_rounds')->restrictOnDelete();
            $table->foreignUuid('position_id')->constrained('positions')->restrictOnDelete();
            $table->enum('status', ['active', 'inactive', 'reengaged', 'expired'])->default('active');
            $table->boolean('reengagement_email_sent')->default(false);
            $table->timestampTz('reengagement_sent_at')->nullable();
            $table->timestampTz('responded_at')->nullable();
            $table->boolean('confirmed_interest')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['applicant_profile_id', 'hiring_round_id', 'position_id'], 'uq_pool_entry');
        });

        DB::statement('CREATE INDEX idx_applicant_pool_profile ON applicant_pool (applicant_profile_id)');
        DB::statement('CREATE INDEX idx_applicant_pool_round_status ON applicant_pool (hiring_round_id, status)');
    }

    public function down(): void
    {
        Schema::dropIfExists('applicant_pool');
    }
};
