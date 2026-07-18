<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculty_load_limits', function (Blueprint $table) {
            $table->uuid('applicant_profile_id')->primary();
            $table->foreign('applicant_profile_id')->references('id')->on('applicant_profiles')->cascadeOnDelete();
            $table->integer('max_units');
            $table->timestampTz('updated_at')->useCurrent();
        });

        DB::statement('ALTER TABLE faculty_load_limits ADD CONSTRAINT chk_faculty_load_limits_max_units CHECK (max_units > 0)');
        DB::statement('CREATE INDEX idx_faculty_load_limits_units ON faculty_load_limits (max_units)');
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty_load_limits');
    }
};
