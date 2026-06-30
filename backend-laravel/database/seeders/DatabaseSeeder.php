<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,       // users first — departments FK references users
            DepartmentSeeder::class, // sets director_id to the seeded director user
        ]);
    }
}
