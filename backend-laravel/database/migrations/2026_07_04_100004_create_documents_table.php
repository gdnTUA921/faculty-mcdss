<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('applicant_profile_id')->constrained('applicant_profiles')->cascadeOnDelete();
            $table->foreignUuid('application_id')->nullable()->constrained('applications')->nullOnDelete();
            $table->string('document_type', 100);
            $table->string('file_name', 255);
            $table->string('file_path', 500);
            $table->string('mime_type', 100);
            $table->bigInteger('file_size_bytes');
            $table->boolean('is_verified')->default(false);
            $table->timestampTz('uploaded_at')->useCurrent();
            $table->foreignUuid('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
        });

        DB::statement('ALTER TABLE documents ADD CONSTRAINT chk_documents_file_size CHECK (file_size_bytes > 0)');
        DB::statement('CREATE INDEX idx_documents_profile ON documents (applicant_profile_id)');
        DB::statement('CREATE INDEX idx_documents_application ON documents (application_id)');
        DB::statement('CREATE INDEX idx_documents_type ON documents (document_type)');
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
