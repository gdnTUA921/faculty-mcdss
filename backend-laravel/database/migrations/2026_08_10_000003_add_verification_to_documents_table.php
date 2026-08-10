<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `documents.is_verified` shipped as a display-only flag: nothing in the API could
 * ever set it, so every document read "Unverified" forever. Verification is now a
 * real admin action, which means an audit trail of who approved a credential and
 * when — otherwise "Verified" is a claim nobody can stand behind.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->foreignUuid('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('verified_at')->nullable();
        });

        // A document is either unverified with no reviewer, or verified with both
        // the reviewer and the timestamp recorded. Half-set states are a bug.
        DB::statement('
            ALTER TABLE documents ADD CONSTRAINT chk_documents_verification CHECK (
                (is_verified = FALSE AND verified_at IS NULL)
                OR (is_verified = TRUE AND verified_at IS NOT NULL)
            )
        ');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_verification');

        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('verified_by');
            $table->dropColumn('verified_at');
        });
    }
};
