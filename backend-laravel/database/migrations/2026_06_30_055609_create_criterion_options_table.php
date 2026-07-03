<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
    {
        Schema::create('criterion_options', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('criterion_id')->constrained('criteria')->cascadeOnDelete();
            $table->string('label', 150);
            $table->string('value', 150);
            $table->decimal('score_value', 5, 4)->nullable();
            $table->integer('display_order')->default(0);


            $table->unique(['criterion_id', 'value'], 'uq_criterion_option');
        });


        DB::statement('ALTER TABLE criterion_options ADD CONSTRAINT chk_criterion_options_score_value CHECK (score_value IS NULL OR (score_value >= 0 AND score_value <= 1))');
        DB::statement('CREATE INDEX idx_criterion_options_criterion_id ON criterion_options (criterion_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('criterion_options');
    }
};
