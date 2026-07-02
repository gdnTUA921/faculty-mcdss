<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_verification_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->string('token', 64)->unique();
            $table->timestampTz('expires_at');
            $table->timestampTz('created_at')->default(DB::raw('NOW()'));

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        DB::statement('CREATE INDEX idx_email_verification_tokens_user ON email_verification_tokens (user_id)');
        DB::statement('CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens (token)');
    }

    public function down(): void
    {
        Schema::dropIfExists('email_verification_tokens');
    }
};
