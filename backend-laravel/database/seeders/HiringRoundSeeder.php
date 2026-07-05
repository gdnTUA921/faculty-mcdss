<?php

namespace Database\Seeders;

use App\Models\HiringRound;
use App\Models\User;
use Illuminate\Database\Seeder;

class HiringRoundSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@mcdss.local')->first();

        HiringRound::firstOrCreate(
            ['name' => 'AY 2026 Faculty Hiring - 1st Semester'],
            [
                'semester' => '1st Semester',
                'academic_year' => 2026,
                'start_date' => '2026-06-01',
                'end_date' => '2026-10-31',
                'status' => 'active',
                'created_by' => $admin?->id,
            ]
        );
    }
}
