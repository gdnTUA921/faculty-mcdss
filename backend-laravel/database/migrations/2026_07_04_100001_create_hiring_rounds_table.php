<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hiring_rounds', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name', 200);
            $table->string('semester', 50);
            $table->integer('academic_year');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['active', 'closed', 'archived'])->default('active');
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('created_at')->useCurrent();
        });

        DB::statement('ALTER TABLE hiring_rounds ADD CONSTRAINT chk_hiring_rounds_academic_year CHECK (academic_year >= 2000)');
        DB::statement('ALTER TABLE hiring_rounds ADD CONSTRAINT chk_round_dates CHECK (end_date >= start_date)');
        DB::statement('CREATE INDEX idx_hiring_rounds_status ON hiring_rounds (status)');
    }

    public function down(): void
    {
        Schema::dropIfExists('hiring_rounds');
    }
};
