<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;


return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('criteria', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('position_id')->constrained('positions')->cascadeOnDelete();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->enum('data_type', ['numeric', 'text', 'boolean', 'select'])->default('numeric');
            $table->decimal('weight', 5, 4);
            $table->decimal('min_value', 10, 2)->nullable();
            $table->decimal('max_value', 10, 2)->nullable();
            $table->boolean('is_required')->default(true);
            $table->integer('display_order')->default(0);
            $table->timestampTz('created_at')->useCurrent();
        });


        DB::statement('ALTER TABLE criteria ADD CONSTRAINT chk_criteria_weight_range CHECK (weight > 0 AND weight <= 1)');
        DB::statement('ALTER TABLE criteria ADD CONSTRAINT chk_criteria_value_range CHECK (min_value IS NULL OR max_value IS NULL OR min_value < max_value)');
        DB::statement('CREATE INDEX idx_criteria_position_id ON criteria (position_id)');
        DB::statement('CREATE INDEX idx_criteria_display_order ON criteria (position_id, display_order)');
    }

    public function down(): void
    {
        Schema::dropIfExists('criteria');
    }
};
