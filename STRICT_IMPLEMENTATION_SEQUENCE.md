# Strict Implementation Sequence

This file defines the recommended build order for the Faculty MCDSS application. The goal is to avoid dependency conflicts and reduce rework by completing each layer before moving to the next.

## Rule

Do not start a later phase until the earlier phase is functionally complete and validated.

## Phase 1. Foundation

- Set up authentication, session handling, and role detection.
- Define the core database entities for users, roles, positions, applications, documents, criteria, and status history.
- Establish the shared layout and navigation shell for each role.

Why this comes first:
- Internal staff accounts, applicant logins, and role-based dashboards all depend on it.
- Every later module reads from the same core user and application records.

## Phase 2. Position Configuration

- Build position management for creating, editing, opening, closing, and filling positions.
- Add per-position criteria and weight configuration.
- Add the configurable form definition structure for each position.

Why this comes next:
- Forms, scoring, and assignment all depend on position-specific criteria and weights.
- Changing the data model later would force rework across downstream modules.

## Phase 3. Account and Registration Flows

- Implement external applicant registration and email verification.
- Implement HR-created temporary internal staff accounts.
- Add first-login profile completion for internal applicants.

Why this comes next:
- The system cannot accept applications until identities and account states are in place.
- Notification triggers for account creation depend on this phase.

## Phase 4. Application Forms and Submission

- Build the external applicant form.
- Build the internal staff application form.
- Implement document upload and document association with profiles.
- Implement application submission, draft handling, and resume parser auto-fill for external applicants.

Why this comes next:
- The application record is the source for status tracking, scoring, ranking, and pool management.
- Forms should not be finalized before the position configuration is stable.

## Phase 5. Hiring Status Tracker

- Implement the default pipeline: Applied, For Interview, For Review, Hired.
- Add status history logging with timestamps.
- Expose applicant-facing and HR-facing status views.

Why this comes next:
- Notifications and pool transitions depend on status changes.
- Status logic should be stable before automated decision modules are added.

## Phase 6. Scoring and Ranking

- Implement WSM scoring per position.
- Add normalized score calculation and score breakdown display.
- Add ranking views for HR and directors.

Why this comes next:
- ILP assignment uses scoring output as input.
- Scoring depends on finalized position criteria and submitted applications.

## Phase 7. Assignment and Optimization

- Implement ILP-based hiring selection.
- Implement ILP-based faculty allocation.
- Add assignment filters for applicant type, department, and position.

Why this comes next:
- Assignment depends on scoring, position setup, and application data.
- Running ILP too early creates mismatches when upstream data changes.

## Phase 8. Applicant Pool

- Add post-round pool conversion for unhired applicants.
- Add pool search, filtering, and reactivation.
- Add re-engagement email triggers.

Why this comes next:
- Pool membership depends on completed hiring rounds and status outcomes.
- Reactivation depends on the application and status lifecycle already being stable.

## Phase 9. Notifications

- Wire email notifications for application received, status changes, account creation, and pool invitations.
- Keep Mailhog for local testing and SMTP abstraction for production.

Why this comes last:
- Notifications are event-driven and should attach to already-stable flows.
- Building them too early usually causes repeated rewiring when event names or states change.

## Phase 10. Dashboard Polish and Reporting

- Finalize HR/admin applicant tables, filters, exports, and inline actions.
- Finalize director views for review and recommendation.
- Finalize applicant portal responsiveness and mobile behavior.

Why this comes last:
- These screens are thin clients over the underlying workflows.
- UI polish is cheaper after the data and workflow contracts stop changing.

## Safe Parallel Work

The following can be done in parallel if the shared contracts are agreed first:

- Frontend shells and layout components for each role.
- Mock data and static screens for early UI review.
- Database schema drafting and API contract drafting.
- Email template design without live triggers.

## High-Risk Conflicts If Out Of Order

- Building assignment before scoring will force rewrites in the optimization inputs.
- Building forms before position criteria will cause form fields to drift from evaluation needs.
- Building pool management before status tracking will leave no reliable way to identify eligible applicants.
- Building notifications before lifecycle events will create duplicate or fragile event wiring.

## Recommended Implementation Order

1. Foundation
2. Position configuration
3. Account and registration flows
4. Application forms and submission
5. Hiring status tracker
6. Scoring and ranking
7. Assignment and optimization
8. Applicant pool
9. Notifications
10. Dashboard polish and reporting