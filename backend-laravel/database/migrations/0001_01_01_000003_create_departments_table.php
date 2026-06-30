<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name', 150)->unique();
            $table->string('code', 20)->unique();
            $table->text('description')->nullable();
            $table->uuid('director_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('created_at')->default(DB::raw('NOW()'));

            $table->foreign('director_id')->references('id')->on('users')->nullOnDelete();
        });

        DB::statement('CREATE INDEX idx_departments_director ON departments (director_id)');
        DB::statement('CREATE INDEX idx_departments_code     ON departments (code)');
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
