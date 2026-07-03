<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("CREATE TYPE applicant_type AS ENUM ('external', 'internal')");

        Schema::create('applicant_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id')->unique();
            $table->string('applicant_type');
            $table->string('institution_email', 255)->nullable();
            $table->text('summary')->nullable();
            $table->jsonb('parsed_resume_data')->nullable();
            $table->timestampTz('profile_completed_at')->nullable();
            $table->timestampTz('created_at')->default(DB::raw('NOW()'));
            $table->timestampTz('updated_at')->default(DB::raw('NOW()'));

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        DB::statement("ALTER TABLE applicant_profiles ALTER COLUMN applicant_type TYPE applicant_type USING applicant_type::applicant_type");

        DB::statement('CREATE INDEX idx_applicant_profiles_user ON applicant_profiles (user_id)');
        DB::statement('CREATE INDEX idx_applicant_profiles_type ON applicant_profiles (applicant_type)');

        DB::statement("
            CREATE TRIGGER trg_applicant_profiles_updated_at
                BEFORE UPDATE ON applicant_profiles
                FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()
        ");
    }

    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS trg_applicant_profiles_updated_at ON applicant_profiles');
        Schema::dropIfExists('applicant_profiles');
        DB::statement('DROP TYPE IF EXISTS applicant_type');
    }
};
