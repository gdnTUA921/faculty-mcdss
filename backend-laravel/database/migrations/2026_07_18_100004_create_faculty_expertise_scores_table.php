<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculty_expertise_scores', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('applicant_profile_id')->constrained('applicant_profiles')->cascadeOnDelete();
            $table->foreignUuid('course_id')->constrained('courses')->cascadeOnDelete();
            $table->decimal('expertise_score', 5, 4);
            $table->text('notes')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['applicant_profile_id', 'course_id'], 'uq_faculty_course_expertise');
        });

        DB::statement('ALTER TABLE faculty_expertise_scores ADD CONSTRAINT chk_faculty_expertise_score CHECK (expertise_score >= 0 AND expertise_score <= 1)');
        DB::statement('CREATE INDEX idx_faculty_expertise_profile ON faculty_expertise_scores (applicant_profile_id)');
        DB::statement('CREATE INDEX idx_faculty_expertise_course ON faculty_expertise_scores (course_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty_expertise_scores');
    }
};
