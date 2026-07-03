<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;


return new class extends Migration
{
  
 public function up(): void
    {
        Schema::create('positions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('department_id')->constrained('departments')->restrictOnDelete();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->enum('target_applicant_type', ['external', 'internal', 'both'])->default('both');
            $table->unsignedInteger('slots_available')->default(1);
            $table->unsignedInteger('slots_filled')->default(0);
            $table->enum('status', ['open', 'closed', 'filled'])->default('open');
            $table->date('application_deadline')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent()->useCurrentOnUpdate();
        });


        DB::statement('ALTER TABLE positions ADD CONSTRAINT chk_positions_slots_available CHECK (slots_available >= 1)');
        DB::statement('ALTER TABLE positions ADD CONSTRAINT chk_positions_slots_filled CHECK (slots_filled >= 0)');
        DB::statement('ALTER TABLE positions ADD CONSTRAINT chk_positions_slots_balance CHECK (slots_filled <= slots_available)');
        DB::statement('CREATE INDEX idx_positions_department_id ON positions (department_id)');
        DB::statement('CREATE INDEX idx_positions_status ON positions (status)');
    }

    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};
