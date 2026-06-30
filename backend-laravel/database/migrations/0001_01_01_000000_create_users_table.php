<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

        // DROP allows migrate:fresh to re-run cleanly (types survive table drops)
        DB::statement('DROP TYPE IF EXISTS user_role CASCADE');

        DB::statement("CREATE TYPE user_role AS ENUM (
            'admin',
            'director',
            'external_applicant',
            'internal_applicant'
        )");

        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('email', 255)->unique();
            $table->string('password', 255); // named password_hash in schema; renamed for Laravel auth
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('phone', 30)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_temp_password')->default(false);
            $table->timestampTz('email_verified_at')->nullable();
            $table->timestampTz('created_at')->default(DB::raw('NOW()'));
            $table->timestampTz('updated_at')->default(DB::raw('NOW()'));
        });

        // Native PostgreSQL ENUM column — add after table creation
        DB::statement("ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'external_applicant'");
        DB::statement("ALTER TABLE users ALTER COLUMN role DROP DEFAULT");

        DB::statement('CREATE INDEX idx_users_email ON users (email)');
        DB::statement('CREATE INDEX idx_users_role  ON users (role)');

        // Shared trigger function — used by users, positions, applicant_profiles
        DB::statement("
            CREATE OR REPLACE FUNCTION trigger_set_updated_at()
            RETURNS TRIGGER AS \$\$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            \$\$ LANGUAGE plpgsql
        ");

        DB::statement("
            CREATE TRIGGER trg_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()
        ");

        // Laravel password-reset infrastructure
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestampTz('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_reset_tokens');
        DB::statement('DROP TRIGGER IF EXISTS trg_users_updated_at ON users');
        Schema::dropIfExists('users');
        DB::statement('DROP TYPE IF EXISTS user_role');
        DB::statement('DROP FUNCTION IF EXISTS trigger_set_updated_at() CASCADE');
    }
};
