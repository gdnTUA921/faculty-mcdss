<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculty_workload', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('applicant_profile_id')->constrained('applicant_profiles')->restrictOnDelete();
            $table->foreignUuid('assignment_run_id')->constrained('assignment_runs')->restrictOnDelete();
            $table->foreignUuid('department_id')->constrained('departments')->restrictOnDelete();
            $table->string('course_code', 20);
            $table->string('course_name', 200);
            $table->integer('units');
            $table->string('semester', 50);
            $table->integer('academic_year');
            $table->timestampTz('assigned_at')->useCurrent();
        });

        DB::statement('ALTER TABLE faculty_workload ADD CONSTRAINT chk_faculty_workload_units CHECK (units > 0)');
        DB::statement('ALTER TABLE faculty_workload ADD CONSTRAINT chk_faculty_workload_academic_year CHECK (academic_year >= 2000)');
        DB::statement('CREATE INDEX idx_faculty_workload_profile ON faculty_workload (applicant_profile_id)');
        DB::statement('CREATE INDEX idx_faculty_workload_run ON faculty_workload (assignment_run_id)');
        DB::statement('CREATE INDEX idx_faculty_workload_semester ON faculty_workload (academic_year, semester)');
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty_workload');
    }
};
