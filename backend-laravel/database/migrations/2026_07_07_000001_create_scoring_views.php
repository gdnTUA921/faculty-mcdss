<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void
    {
        DB::statement("CREATE OR REPLACE VIEW v_applicant_rankings AS
        SELECT a.id AS application_id, ap.id AS applicant_profile_id,
        u.first_name || ' ' || u.last_name AS applicant_name,
        u.first_name AS first_name,
        u.last_name AS last_name,
        ap.applicant_type,
        p.id AS position_id, p.title AS position_title,
        d.name AS department_name,
        hr.id AS hiring_round_id, hr.name AS hiring_round_name,
        a.status,
        a.total_wsm_score,
        RANK() OVER(
             PARTITION BY a.position_id, a.hiring_round_id
              ORDER BY a.total_wsm_score DESC NULLS LAST)
              AS rank_in_position, a.applied_at
              FROM applications a
              JOIN applicant_profiles ap ON ap.id = a.applicant_profile_id
              JOIN users u ON u.id = ap.user_id
              JOIN positions p ON p.id = a.position_id
              JOIN departments d ON d.id = p.department_id
              JOIN hiring_rounds hr ON hr.id = a.hiring_round_id;
              ");

        DB::statement("
              CREATE OR REPLACE VIEW v_wsm_score_breakdown AS
              SELECT 
                afr.application_id,
                a.total_wsm_score,
                c.position_id,
                c.name AS criterion_name,
                c.weight,
                afr.raw_value,
                afr.normalized_score,
                afr.weighted_score
                FROM application_form_responses afr
                JOIN criteria c ON c.id = afr.criterion_id
                JOIN applications a ON a.id = afr.application_id;
              ");
    }
    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS v_wsm_score_breakdown;");
        DB::statement("DROP VIEW IF EXISTS v_applicant_rankings;");
    }
};

