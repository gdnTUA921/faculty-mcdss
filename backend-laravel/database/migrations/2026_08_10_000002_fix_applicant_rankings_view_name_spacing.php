<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The live v_applicant_rankings view concatenates first_name and last_name with
 * no separator ("FirstLast"), and is also missing the first_name/last_name/email
 * columns the source migration defines and the frontend's RankingRow type expects.
 * Both diverged from 2026_07_07_000001_create_scoring_views.php at some point
 * after that migration ran, so a schema fix here is the only way to correct an
 * already-deployed view -- editing the original file has no effect post-deploy.
 *
 * Postgres only allows CREATE OR REPLACE VIEW to append new columns at the end
 * of the existing list, not insert or reorder them -- so the live column order
 * (application_id, applicant_profile_id, applicant_name, applicant_type, ...)
 * is preserved exactly, with first_name/last_name/email appended after it.
 */
return new class extends Migration
{
    public function up(): void
    {
        // DROP first rather than CREATE OR REPLACE: Postgres only lets CREATE OR
        // REPLACE append trailing columns, so it cannot reconcile the differing
        // column order this view has on a fresh build (where the base migration
        // put first_name/last_name before applicant_type). Dropping first lets us
        // set the final column order unconditionally, working on both fresh and
        // already-deployed databases.
        DB::statement('DROP VIEW IF EXISTS v_applicant_rankings');

        DB::statement("CREATE VIEW v_applicant_rankings AS
        SELECT a.id AS application_id, ap.id AS applicant_profile_id,
        u.first_name || ' ' || u.last_name AS applicant_name,
        ap.applicant_type,
        p.id AS position_id, p.title AS position_title,
        d.name AS department_name,
        hr.id AS hiring_round_id, hr.name AS hiring_round_name,
        a.status,
        a.total_wsm_score,
        RANK() OVER(
             PARTITION BY a.position_id, a.hiring_round_id
              ORDER BY a.total_wsm_score DESC NULLS LAST)
              AS rank_in_position, a.applied_at,
        u.first_name AS first_name,
        u.last_name AS last_name,
        u.email AS email
              FROM applications a
              JOIN applicant_profiles ap ON ap.id = a.applicant_profile_id
              JOIN users u ON u.id = ap.user_id
              JOIN positions p ON p.id = a.position_id
              JOIN departments d ON d.id = p.department_id
              JOIN hiring_rounds hr ON hr.id = a.hiring_round_id;
              ");
    }

    public function down(): void
    {
        // The appended columns can't be dropped via CREATE OR REPLACE (Postgres only
        // allows adding trailing columns that way), so rebuild the view outright.
        // Nothing else in the schema depends on v_applicant_rankings.
        DB::statement('DROP VIEW v_applicant_rankings');

        DB::statement("CREATE VIEW v_applicant_rankings AS
        SELECT a.id AS application_id, ap.id AS applicant_profile_id,
        u.first_name || '' || u.last_name AS applicant_name,
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
    }
};
