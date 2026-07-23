<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE OR REPLACE VIEW v_active_pool AS
            SELECT
                apl.id                                      AS pool_entry_id,
                ap.id                                       AS applicant_profile_id,
                u.first_name || ' ' || u.last_name          AS applicant_name,
                u.email,
                ap.applicant_type,
                p.title                                     AS original_position,
                d.name                                      AS department_name,
                hr.name                                     AS original_round,
                apl.status                                  AS pool_status,
                apl.reengagement_email_sent,
                apl.reengagement_sent_at,
                apl.confirmed_interest,
                apl.created_at
            FROM applicant_pool      apl
            JOIN applicant_profiles  ap  ON ap.id  = apl.applicant_profile_id
            JOIN users               u   ON u.id   = ap.user_id
            JOIN positions           p   ON p.id   = apl.position_id
            JOIN departments         d   ON d.id   = p.department_id
            JOIN hiring_rounds       hr  ON hr.id  = apl.hiring_round_id
            WHERE apl.status = 'active';
        ");
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS v_active_pool;');
    }
};
