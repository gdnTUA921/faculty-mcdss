<?php

namespace Database\Seeders;

use App\Models\ApplicantProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /** Applicant roles cannot use any /api/applicant/* endpoint without a profile row. */
    private const PROFILE_TYPE_FOR_ROLE = [
        'internal_applicant' => 'internal',
        'external_applicant' => 'external',
    ];

    public function run(): void
    {
        $users = [
            [
                'first_name' => 'Admin',
                'last_name'  => 'User',
                'email'      => 'admin@mcdss.local',
                'password'   => Hash::make('password'),
                'role'       => 'admin',
            ],
            [
                'first_name' => 'Academic',
                'last_name'  => 'Director',
                'email'      => 'director@mcdss.local',
                'password'   => Hash::make('password'),
                'role'       => 'director',
            ],
            [
                'first_name' => 'Internal',
                'last_name'  => 'Applicant',
                'email'      => 'internal@mcdss.local',
                'password'   => Hash::make('password'),
                'role'       => 'internal_applicant',
            ],
            [
                'first_name' => 'External',
                'last_name'  => 'Applicant',
                'email'      => 'external@mcdss.local',
                'password'   => Hash::make('password'),
                'role'       => 'external_applicant',
            ],
        ];

        foreach ($users as $data) {
            $user = User::firstOrCreate(['email' => $data['email']], $data);

            // Without this, every /api/applicant/* call for the seeded applicants 422s with
            // "Applicant profile not found for this user."
            if ($type = self::PROFILE_TYPE_FOR_ROLE[$user->role] ?? null) {
                ApplicantProfile::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'applicant_type'    => $type,
                        'institution_email' => $type === 'internal' ? $user->email : null,
                        'summary'           => "Seeded {$type} applicant for local development.",
                    ],
                );
            }
        }
    }
}
