<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('department_id')->constrained('departments')->restrictOnDelete();
            $table->string('course_code', 20)->unique();
            $table->string('course_name', 200);
            $table->integer('units');
            $table->string('semester', 50);
            $table->integer('academic_year');
            $table->unsignedInteger('sections_required')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestampTz('created_at')->useCurrent();
        });

        DB::statement('ALTER TABLE courses ADD CONSTRAINT chk_courses_units CHECK (units > 0)');
        DB::statement('ALTER TABLE courses ADD CONSTRAINT chk_courses_academic_year CHECK (academic_year >= 2000)');
        DB::statement('ALTER TABLE courses ADD CONSTRAINT chk_courses_sections_required CHECK (sections_required >= 1)');
        DB::statement('CREATE INDEX idx_courses_department ON courses (department_id)');
        DB::statement('CREATE INDEX idx_courses_term ON courses (academic_year, semester)');
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
