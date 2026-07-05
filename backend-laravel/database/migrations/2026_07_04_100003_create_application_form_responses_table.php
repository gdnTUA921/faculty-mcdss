<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_form_responses', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('application_id')->constrained('applications')->cascadeOnDelete();
            $table->foreignUuid('criterion_id')->constrained('criteria')->restrictOnDelete();
            $table->text('raw_value')->nullable();
            $table->decimal('normalized_score', 8, 4)->nullable();
            $table->decimal('weighted_score', 8, 4)->nullable();
            $table->timestampTz('responded_at')->useCurrent();

            $table->unique(['application_id', 'criterion_id'], 'uq_response');
        });

        DB::statement('ALTER TABLE application_form_responses ADD CONSTRAINT chk_afr_normalized_score CHECK (normalized_score IS NULL OR (normalized_score >= 0 AND normalized_score <= 1))');
        DB::statement('ALTER TABLE application_form_responses ADD CONSTRAINT chk_afr_weighted_score CHECK (weighted_score IS NULL OR (weighted_score >= 0 AND weighted_score <= 1))');
        DB::statement('CREATE INDEX idx_afr_application ON application_form_responses (application_id)');
        DB::statement('CREATE INDEX idx_afr_criterion ON application_form_responses (criterion_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('application_form_responses');
    }
};
