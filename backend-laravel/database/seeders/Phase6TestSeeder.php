<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\ApplicantProfile;
use App\Models\Position;
use App\Models\Criterion;
use App\Models\CriterionOption;
use App\Models\Application;
use App\Models\ApplicationFormResponse;
use App\Models\HiringRound;
use Illuminate\Database\Seeder;

class Phase6TestSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Get active hiring round
        $round = HiringRound::where('status', 'active')->first();
        if (!$round) {
            $this->command->error("No active hiring round found. Make sure user seeders ran first.");
            return;
        }

        // 2. Get COE department (or any department)
        $department = \App\Models\Department::first();
        if (!$department) {
            $this->command->error("No department found. Make sure user seeders ran first.");
            return;
        }

        // 3. Create Position
        $position = Position::create([
            'department_id' => $department->id,
            'title' => 'Test Lecturer in Computer Science',
            'description' => 'Test Position for WSM scoring',
            'target_applicant_type' => 'both',
            'slots_available' => 2,
            'slots_filled' => 0,
            'status' => 'open',
            'application_deadline' => now()->addDays(30),
        ]);

        // 4. Create Criteria (weights must sum to 1.0)
        $c1 = Criterion::create([
            'position_id' => $position->id,
            'name' => 'Years of Teaching Experience',
            'data_type' => 'numeric',
            'weight' => 0.5000,
            'min_value' => 0,
            'max_value' => 10,
            'is_required' => true,
            'display_order' => 1,
        ]);

        $c2 = Criterion::create([
            'position_id' => $position->id,
            'name' => 'Highest Degree Obtained',
            'data_type' => 'select',
            'weight' => 0.3000,
            'is_required' => true,
            'display_order' => 2,
        ]);

        CriterionOption::create([
            'criterion_id' => $c2->id,
            'label' => "Bachelor's",
            'value' => 'bs',
            'score_value' => 0.3000,
            'display_order' => 1,
        ]);
        CriterionOption::create([
            'criterion_id' => $c2->id,
            'label' => "Master's",
            'value' => 'ms',
            'score_value' => 0.7000,
            'display_order' => 2,
        ]);
        CriterionOption::create([
            'criterion_id' => $c2->id,
            'label' => 'PhD',
            'value' => 'phd',
            'score_value' => 1.0000,
            'display_order' => 3,
        ]);

        $c3 = Criterion::create([
            'position_id' => $position->id,
            'name' => 'Has Active Research',
            'data_type' => 'boolean',
            'weight' => 0.2000,
            'is_required' => true,
            'display_order' => 3,
        ]);

        // 5. Get or Create Applicant User
        $user = User::where('email', 'external@mcdss.local')->first();
        $profile = $user->applicantProfile;
        if (!$profile) {
            $profile = ApplicantProfile::create([
                'user_id' => $user->id,
                'applicant_type' => 'external',
            ]);
        }

        // 6. Create submitted Application (status = applied)
        $app = Application::create([
            'applicant_profile_id' => $profile->id,
            'position_id' => $position->id,
            'hiring_round_id' => $round->id,
            'status' => 'applied',
        ]);

        // 7. Add responses
        // Numeric: 5 years of experience (normalized = 0.5, weighted = 0.25)
        ApplicationFormResponse::create([
            'application_id' => $app->id,
            'criterion_id' => $c1->id,
            'raw_value' => '5',
        ]);

        // Select: MS (score_value = 0.7, weighted = 0.21)
        ApplicationFormResponse::create([
            'application_id' => $app->id,
            'criterion_id' => $c2->id,
            'raw_value' => 'ms',
        ]);

        // Boolean: Yes/True (normalized = 1.0, weighted = 0.20)
        ApplicationFormResponse::create([
            'application_id' => $app->id,
            'criterion_id' => $c3->id,
            'raw_value' => 'true',
        ]);

        $this->command->info("---- SEED SUCCESSFUL ----");
        $this->command->info("Position ID: " . $position->id);
        $this->command->info("Application ID: " . $app->id);
    }
}
