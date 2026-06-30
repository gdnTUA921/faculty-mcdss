<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
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
            User::firstOrCreate(['email' => $data['email']], $data);
        }
    }
}
