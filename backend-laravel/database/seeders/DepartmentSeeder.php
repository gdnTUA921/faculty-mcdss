<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $director = User::where('email', 'director@mcdss.local')->first();

        $departments = [
            [
                'name'        => 'College of Engineering',
                'code'        => 'COE',
                'description' => 'Undergraduate and graduate engineering programs.',
                'director_id' => $director?->id,
            ],
            [
                'name'        => 'College of Business',
                'code'        => 'COB',
                'description' => 'Business administration and management programs.',
                'director_id' => null,
            ],
            [
                'name'        => 'College of Arts and Sciences',
                'code'        => 'CAS',
                'description' => 'Liberal arts, sciences, and humanities programs.',
                'director_id' => null,
            ],
        ];

        foreach ($departments as $data) {
            Department::firstOrCreate(['code' => $data['code']], $data);
        }
    }
}
