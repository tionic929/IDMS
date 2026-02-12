<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create an Admin User
        User::create([
            'name'              => 'admin',
            'email'             => 'admin@svizcarra.online',
            'email_verified_at' => now(),
            'password'          => Hash::make('admin0929'), // Change this for production!
            'role'              => 'admin',
            'remember_token'    => Str::random(10),
        ]);

        // 3. Optional: Create multiple random applicants using a factory
        // User::factory(10)->create(['role' => 'applicant']);
    }
}