-- =============================================================================
-- Faculty Multi-Criteria Decision Support System (MCDSS)
-- PostgreSQL Database Schema
-- =============================================================================
-- Tech Stack : Next.js | Laravel | Python/FastAPI | PostgreSQL
-- Generated  : 2026-05-18
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- SECTION 1: IDENTITY & ACCESS
-- =============================================================================

CREATE TYPE user_role AS ENUM (
    'admin',
    'director',
    'external_applicant',
    'internal_applicant'
);

CREATE TABLE users (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255)    NOT NULL UNIQUE,
    password_hash       VARCHAR(255)    NOT NULL,
    role                user_role       NOT NULL,
    first_name          VARCHAR(100)    NOT NULL,
    last_name           VARCHAR(100)    NOT NULL,
    phone               VARCHAR(30),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_temp_password    BOOLEAN         NOT NULL DEFAULT FALSE,
    email_verified_at   TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users                 IS 'Central identity store for all user roles (admin, director, external/internal applicants).';
COMMENT ON COLUMN users.role            IS 'admin | director | external_applicant | internal_applicant';
COMMENT ON COLUMN users.is_temp_password IS 'TRUE for internal staff accounts created by HR; cleared after first login password reset.';


-- -----------------------------------------------------------------------------

CREATE TABLE departments (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150)    NOT NULL UNIQUE,
    code        VARCHAR(20)     NOT NULL UNIQUE,
    description TEXT,
    director_id UUID            REFERENCES users (id) ON DELETE SET NULL,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  departments             IS 'Academic departments. director_id scopes Academic Director access.';
COMMENT ON COLUMN departments.director_id IS 'FK to the user who is the Academic Director of this department.';


-- =============================================================================
-- SECTION 2: POSITIONS & CRITERIA
-- =============================================================================

CREATE TYPE target_applicant_type AS ENUM ('external', 'internal', 'both');
CREATE TYPE position_status       AS ENUM ('open', 'closed', 'filled');

CREATE TABLE positions (
    id                      UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id           UUID                    NOT NULL REFERENCES departments (id) ON DELETE RESTRICT,
    title                   VARCHAR(200)            NOT NULL,
    description             TEXT,
    target_applicant_type   target_applicant_type   NOT NULL DEFAULT 'both',
    slots_available         INTEGER                 NOT NULL DEFAULT 1 CHECK (slots_available >= 1),
    slots_filled            INTEGER                 NOT NULL DEFAULT 0 CHECK (slots_filled >= 0),
    status                  position_status         NOT NULL DEFAULT 'open',
    application_deadline    DATE,
    created_by              UUID                    REFERENCES users (id) ON DELETE SET NULL,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_slots CHECK (slots_filled <= slots_available)
);

COMMENT ON TABLE  positions                     IS 'Each open position is an independent entity with its own criteria, weights, and applicant type target.';
COMMENT ON COLUMN positions.target_applicant_type IS 'Restricts who may apply: external only, internal only, or both.';
COMMENT ON COLUMN positions.slots_filled        IS 'Incremented as assignment results are confirmed. Must not exceed slots_available.';


-- -----------------------------------------------------------------------------

CREATE TYPE criterion_data_type AS ENUM ('numeric', 'text', 'boolean', 'select');

CREATE TABLE criteria (
    id              UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id     UUID                    NOT NULL REFERENCES positions (id) ON DELETE CASCADE,
    name            VARCHAR(150)            NOT NULL,
    description     TEXT,
    data_type       criterion_data_type     NOT NULL DEFAULT 'numeric',
    weight          DECIMAL(5,4)            NOT NULL CHECK (weight > 0 AND weight <= 1),
    min_value       DECIMAL(10,2),
    max_value       DECIMAL(10,2),
    is_required     BOOLEAN                 NOT NULL DEFAULT TRUE,
    display_order   INTEGER                 NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_weight_range   CHECK (weight > 0 AND weight <= 1),
    CONSTRAINT chk_value_range    CHECK (min_value IS NULL OR max_value IS NULL OR min_value < max_value)
);

COMMENT ON TABLE  criteria            IS 'Position-specific evaluation criteria for the Weighted Sum Model (WSM). Weights per position should sum to 1.0.';
COMMENT ON COLUMN criteria.weight     IS 'Contribution weight in the WSM. All criteria weights for a position must sum to 1.0 (enforced at application level).';
COMMENT ON COLUMN criteria.data_type  IS 'Drives the application form field renderer and normalization logic.';
COMMENT ON COLUMN criteria.min_value  IS 'Lower bound for numeric normalization to 0–1 scale.';
COMMENT ON COLUMN criteria.max_value  IS 'Upper bound for numeric normalization to 0–1 scale.';


-- =============================================================================
-- SECTION 3: HIRING ROUNDS
-- =============================================================================

CREATE TYPE round_status AS ENUM ('active', 'closed', 'archived');

CREATE TABLE hiring_rounds (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200)    NOT NULL,
    semester        VARCHAR(50)     NOT NULL,
    academic_year   INTEGER         NOT NULL CHECK (academic_year >= 2000),
    start_date      DATE            NOT NULL,
    end_date        DATE            NOT NULL,
    status          round_status    NOT NULL DEFAULT 'active',
    created_by      UUID            REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_round_dates CHECK (end_date >= start_date)
);

COMMENT ON TABLE  hiring_rounds               IS 'Semester-scoped hiring cycles. Applications, pool entries, and ILP runs are anchored to a round.';
COMMENT ON COLUMN hiring_rounds.academic_year IS 'Academic year start (e.g. 2025 for AY 2025-2026).';


-- =============================================================================
-- SECTION 4: APPLICANTS & APPLICATIONS
-- =============================================================================

CREATE TYPE applicant_type AS ENUM ('external', 'internal');

CREATE TABLE applicant_profiles (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID            NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    applicant_type          applicant_type  NOT NULL,
    institution_email       VARCHAR(255),
    summary                 TEXT,
    parsed_resume_data      JSONB,
    profile_completed_at    TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  applicant_profiles                    IS 'Persistent identity and profile data for every applicant. Survives across hiring rounds.';
COMMENT ON COLUMN applicant_profiles.institution_email  IS 'For internal applicants: their institutional email address.';
COMMENT ON COLUMN applicant_profiles.parsed_resume_data IS 'Raw structured JSON output from the FastAPI resume parser. Preserved regardless of current criteria.';


-- -----------------------------------------------------------------------------

CREATE TYPE application_status AS ENUM (
    'applied',
    'for_interview',
    'for_review',
    'hired',
    'rejected',
    'withdrawn'
);

CREATE TYPE pool_status AS ENUM ('active', 'inactive', 'reengaged', 'expired');

CREATE TABLE applications (
    id                      UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_profile_id    UUID                NOT NULL REFERENCES applicant_profiles (id) ON DELETE CASCADE,
    position_id             UUID                NOT NULL REFERENCES positions (id) ON DELETE RESTRICT,
    hiring_round_id         UUID                NOT NULL REFERENCES hiring_rounds (id) ON DELETE RESTRICT,
    status                  application_status  NOT NULL DEFAULT 'applied',
    total_wsm_score         DECIMAL(8,4)        CHECK (total_wsm_score >= 0 AND total_wsm_score <= 1),
    is_pool_member          BOOLEAN             NOT NULL DEFAULT FALSE,
    pool_status             pool_status,
    applied_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status_updated_at       TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- One applicant may apply to the same position only once per hiring round
    CONSTRAINT uq_application UNIQUE (applicant_profile_id, position_id, hiring_round_id)
);

COMMENT ON TABLE  applications                  IS 'Join between applicant_profiles and positions for a hiring round. One applicant can apply to multiple positions.';
COMMENT ON COLUMN applications.total_wsm_score  IS 'Pre-computed WSM aggregate score (0–1). Stored for fast dashboard queries.';
COMMENT ON COLUMN applications.is_pool_member   IS 'Set TRUE when applicant is moved to the applicant pool at round close.';


-- -----------------------------------------------------------------------------

CREATE TABLE application_form_responses (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id      UUID            NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    criterion_id        UUID            NOT NULL REFERENCES criteria (id) ON DELETE RESTRICT,
    raw_value           TEXT,
    normalized_score    DECIMAL(8,4)    CHECK (normalized_score >= 0 AND normalized_score <= 1),
    weighted_score      DECIMAL(8,4)    CHECK (weighted_score >= 0 AND weighted_score <= 1),
    responded_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_response UNIQUE (application_id, criterion_id)
);

COMMENT ON TABLE  application_form_responses                IS 'Per-criterion answers for each application, with pre-computed scores for the WSM breakdown view.';
COMMENT ON COLUMN application_form_responses.raw_value      IS 'Raw applicant-submitted value before normalization.';
COMMENT ON COLUMN application_form_responses.normalized_score IS 'Raw value scaled to 0–1 using criterion min/max.';
COMMENT ON COLUMN application_form_responses.weighted_score   IS 'normalized_score × criterion weight. Summed into total_wsm_score on applications.';


-- =============================================================================
-- SECTION 5: DOCUMENTS
-- =============================================================================

CREATE TABLE documents (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_profile_id    UUID            NOT NULL REFERENCES applicant_profiles (id) ON DELETE CASCADE,
    application_id          UUID            REFERENCES applications (id) ON DELETE SET NULL,
    document_type           VARCHAR(100)    NOT NULL,
    file_name               VARCHAR(255)    NOT NULL,
    file_path               VARCHAR(500)    NOT NULL,
    mime_type               VARCHAR(100)    NOT NULL,
    file_size_bytes         BIGINT          NOT NULL CHECK (file_size_bytes > 0),
    is_verified             BOOLEAN         NOT NULL DEFAULT FALSE,
    uploaded_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    uploaded_by             UUID            REFERENCES users (id) ON DELETE SET NULL
);

COMMENT ON TABLE  documents                  IS 'Centralised document repository. Profile-level docs persist across rounds; application_id is optional for submission-specific docs.';
COMMENT ON COLUMN documents.document_type    IS 'E.g. transcript, certificate, government_id, employment_record, publication.';
COMMENT ON COLUMN documents.is_verified      IS 'HR/admin document review flag.';


-- =============================================================================
-- SECTION 6: AUDIT & NOTIFICATIONS
-- =============================================================================

CREATE TABLE status_history (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id      UUID                NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    previous_status     application_status,
    new_status          application_status  NOT NULL,
    notes               TEXT,
    changed_by          UUID                REFERENCES users (id) ON DELETE SET NULL,
    changed_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE status_history IS 'Immutable audit log of every application status transition. Rows are never updated, only inserted.';


-- -----------------------------------------------------------------------------

CREATE TYPE notification_type AS ENUM (
    'application_received',
    'status_change',
    'pool_invitation',
    'account_created',
    'reengagement'
);

CREATE TYPE notification_channel  AS ENUM ('email', 'in_app');
CREATE TYPE notification_delivery AS ENUM ('pending', 'sent', 'failed');

CREATE TABLE notifications (
    id                  UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID                    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    application_id      UUID                    REFERENCES applications (id) ON DELETE SET NULL,
    type                notification_type       NOT NULL,
    subject             VARCHAR(255)            NOT NULL,
    body                TEXT                    NOT NULL,
    channel             notification_channel    NOT NULL DEFAULT 'email',
    delivery_status     notification_delivery   NOT NULL DEFAULT 'pending',
    sent_at             TIMESTAMP WITH TIME ZONE,
    read_at             TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  notifications                 IS 'All outbound communications (email via Mailhog/SMTP + in-app). Tracks delivery and read state.';
COMMENT ON COLUMN notifications.application_id  IS 'Optional reference to the related application for context-aware notifications.';
COMMENT ON COLUMN notifications.read_at         IS 'Set when the user reads the notification in-app.';


-- =============================================================================
-- SECTION 7: APPLICANT POOL
-- =============================================================================

CREATE TABLE applicant_pool (
    id                          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_profile_id        UUID            NOT NULL REFERENCES applicant_profiles (id) ON DELETE CASCADE,
    hiring_round_id             UUID            NOT NULL REFERENCES hiring_rounds (id) ON DELETE RESTRICT,
    position_id                 UUID            NOT NULL REFERENCES positions (id) ON DELETE RESTRICT,
    status                      pool_status     NOT NULL DEFAULT 'active',
    reengagement_email_sent     BOOLEAN         NOT NULL DEFAULT FALSE,
    reengagement_sent_at        TIMESTAMP WITH TIME ZONE,
    responded_at                TIMESTAMP WITH TIME ZONE,
    confirmed_interest          BOOLEAN,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pool_entry UNIQUE (applicant_profile_id, hiring_round_id, position_id)
);

COMMENT ON TABLE  applicant_pool                        IS 'Manages unhired applicants across rounds. Pool membership is separate from application status.';
COMMENT ON COLUMN applicant_pool.reengagement_email_sent IS 'Set TRUE when HR sends a re-engagement email for a new round.';
COMMENT ON COLUMN applicant_pool.confirmed_interest     IS 'TRUE = applicant confirmed interest; FALSE = declined; NULL = no response yet.';


-- =============================================================================
-- SECTION 8: ASSIGNMENT / ILP
-- =============================================================================

CREATE TYPE assignment_run_scope  AS ENUM ('external', 'internal', 'both');
CREATE TYPE assignment_run_status AS ENUM ('pending', 'running', 'completed', 'failed');

CREATE TABLE assignment_runs (
    id                      UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    hiring_round_id         UUID                    NOT NULL REFERENCES hiring_rounds (id) ON DELETE RESTRICT,
    scope_applicant_type    assignment_run_scope,
    scope_position_ids      JSONB,
    scope_department_ids    JSONB,
    ilp_parameters          JSONB,
    status                  assignment_run_status   NOT NULL DEFAULT 'pending',
    result_summary          JSONB,
    run_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at            TIMESTAMP WITH TIME ZONE,
    run_by                  UUID                    REFERENCES users (id) ON DELETE SET NULL
);

COMMENT ON TABLE  assignment_runs                       IS 'Records every ILP solver execution with scope filters and parameters for auditability and reproducibility.';
COMMENT ON COLUMN assignment_runs.scope_applicant_type  IS 'Filter applied to this run. NULL means all applicant types.';
COMMENT ON COLUMN assignment_runs.scope_position_ids    IS 'JSON array of position UUIDs included in this run. NULL means all open positions.';
COMMENT ON COLUMN assignment_runs.scope_department_ids  IS 'JSON array of department UUIDs included. NULL means all departments.';
COMMENT ON COLUMN assignment_runs.ilp_parameters        IS 'Solver configuration: objective type, custom constraints, time limit, etc.';
COMMENT ON COLUMN assignment_runs.result_summary        IS 'High-level output stats: total objective score, number of assignments made, etc.';


-- -----------------------------------------------------------------------------

CREATE TABLE assignment_results (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_run_id   UUID            NOT NULL REFERENCES assignment_runs (id) ON DELETE CASCADE,
    application_id      UUID            NOT NULL REFERENCES applications (id) ON DELETE RESTRICT,
    position_id         UUID            NOT NULL REFERENCES positions (id) ON DELETE RESTRICT,
    is_assigned         BOOLEAN         NOT NULL,
    objective_score     DECIMAL(8,4),
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_run_application UNIQUE (assignment_run_id, application_id)
);

COMMENT ON TABLE  assignment_results                IS 'Output of each ILP run: one row per application evaluated. is_assigned = TRUE means the solver selected this applicant.';
COMMENT ON COLUMN assignment_results.objective_score IS 'WSM score contribution to the ILP objective function for this applicant-position pair.';


-- -----------------------------------------------------------------------------

CREATE TABLE faculty_workload (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_profile_id    UUID            NOT NULL REFERENCES applicant_profiles (id) ON DELETE RESTRICT,
    assignment_run_id       UUID            NOT NULL REFERENCES assignment_runs (id) ON DELETE RESTRICT,
    department_id           UUID            NOT NULL REFERENCES departments (id) ON DELETE RESTRICT,
    course_code             VARCHAR(20)     NOT NULL,
    course_name             VARCHAR(200)    NOT NULL,
    units                   INTEGER         NOT NULL CHECK (units > 0),
    semester                VARCHAR(50)     NOT NULL,
    academic_year           INTEGER         NOT NULL CHECK (academic_year >= 2000),
    assigned_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE faculty_workload IS 'Output of the internal faculty load allocation ILP. One row per course assigned to a faculty member per semester.';


-- =============================================================================
-- SECTION 9: INDEXES
-- =============================================================================

-- users
CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_role     ON users (role);

-- departments
CREATE INDEX idx_departments_director   ON departments (director_id);
CREATE INDEX idx_departments_code       ON departments (code);

-- positions
CREATE INDEX idx_positions_department_status ON positions (department_id, status);
CREATE INDEX idx_positions_status            ON positions (status);

-- criteria
CREATE INDEX idx_criteria_position  ON criteria (position_id);

-- hiring_rounds
CREATE INDEX idx_hiring_rounds_status ON hiring_rounds (status);

-- applicant_profiles
CREATE INDEX idx_applicant_profiles_user        ON applicant_profiles (user_id);
CREATE INDEX idx_applicant_profiles_type        ON applicant_profiles (applicant_type);

-- applications
CREATE INDEX idx_applications_profile           ON applications (applicant_profile_id);
CREATE INDEX idx_applications_position_status   ON applications (position_id, status);
CREATE INDEX idx_applications_round             ON applications (hiring_round_id);
CREATE INDEX idx_applications_wsm_score         ON applications (total_wsm_score DESC);
CREATE INDEX idx_applications_pool              ON applications (is_pool_member) WHERE is_pool_member = TRUE;

-- application_form_responses
CREATE INDEX idx_afr_application    ON application_form_responses (application_id);
CREATE INDEX idx_afr_criterion      ON application_form_responses (criterion_id);

-- documents
CREATE INDEX idx_documents_profile      ON documents (applicant_profile_id);
CREATE INDEX idx_documents_application  ON documents (application_id);
CREATE INDEX idx_documents_type         ON documents (document_type);

-- status_history
CREATE INDEX idx_status_history_application ON status_history (application_id, changed_at DESC);
CREATE INDEX idx_status_history_changed_by  ON status_history (changed_by);

-- notifications
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_delivery    ON notifications (delivery_status) WHERE delivery_status = 'pending';

-- applicant_pool
CREATE INDEX idx_applicant_pool_profile         ON applicant_pool (applicant_profile_id);
CREATE INDEX idx_applicant_pool_round_status    ON applicant_pool (hiring_round_id, status);

-- assignment_runs
CREATE INDEX idx_assignment_runs_round      ON assignment_runs (hiring_round_id);
CREATE INDEX idx_assignment_runs_status     ON assignment_runs (status);

-- assignment_results
CREATE INDEX idx_assignment_results_run         ON assignment_results (assignment_run_id);
CREATE INDEX idx_assignment_results_application ON assignment_results (application_id);
CREATE INDEX idx_assignment_results_assigned    ON assignment_results (assignment_run_id, is_assigned) WHERE is_assigned = TRUE;

-- faculty_workload
CREATE INDEX idx_faculty_workload_profile   ON faculty_workload (applicant_profile_id);
CREATE INDEX idx_faculty_workload_run       ON faculty_workload (assignment_run_id);
CREATE INDEX idx_faculty_workload_semester  ON faculty_workload (academic_year, semester);


-- =============================================================================
-- SECTION 10: TRIGGERS (updated_at auto-maintenance)
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_positions_updated_at
    BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_applicant_profiles_updated_at
    BEFORE UPDATE ON applicant_profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- =============================================================================
-- SECTION 11: VIEWS
-- =============================================================================

-- Ranked applicants per position for a given hiring round
CREATE OR REPLACE VIEW v_applicant_rankings AS
SELECT
    a.id                                        AS application_id,
    ap.id                                       AS applicant_profile_id,
    u.first_name || ' ' || u.last_name          AS applicant_name,
    ap.applicant_type,
    p.id                                        AS position_id,
    p.title                                     AS position_title,
    d.name                                      AS department_name,
    hr.id                                       AS hiring_round_id,
    hr.name                                     AS hiring_round_name,
    a.status,
    a.total_wsm_score,
    RANK() OVER (
        PARTITION BY a.position_id, a.hiring_round_id
        ORDER BY a.total_wsm_score DESC NULLS LAST
    )                                           AS rank_in_position,
    a.applied_at
FROM applications        a
JOIN applicant_profiles  ap ON ap.id = a.applicant_profile_id
JOIN users               u  ON u.id  = ap.user_id
JOIN positions           p  ON p.id  = a.position_id
JOIN departments         d  ON d.id  = p.department_id
JOIN hiring_rounds       hr ON hr.id = a.hiring_round_id;

COMMENT ON VIEW v_applicant_rankings IS 'Ranked applicants per position per hiring round ordered by WSM score. Used by the HR dashboard ranking view.';

-- -----------------------------------------------------------------------

-- WSM score breakdown per application
CREATE OR REPLACE VIEW v_wsm_score_breakdown AS
SELECT
    afr.application_id,
    a.total_wsm_score,
    c.position_id,
    c.name          AS criterion_name,
    c.weight,
    afr.raw_value,
    afr.normalized_score,
    afr.weighted_score
FROM application_form_responses afr
JOIN criteria     c ON c.id = afr.criterion_id
JOIN applications a ON a.id = afr.application_id;

COMMENT ON VIEW v_wsm_score_breakdown IS 'Per-criterion score breakdown for every application. Powers the score transparency panel.';

-- -----------------------------------------------------------------------

-- Applicant pool dashboard view
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

COMMENT ON VIEW v_active_pool IS 'Active applicant pool members with contact info and re-engagement state. Used by the HR pool management dashboard.';


-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
