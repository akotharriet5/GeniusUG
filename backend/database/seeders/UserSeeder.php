<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds one admin, two parents and three pupils for development.
 * Safe to re-run: users are matched by email and updated, not duplicated.
 *
 * Passwords come from .env so nothing real is hard-coded:
 *   SEED_ADMIN_PASSWORD=...   SEED_USER_PASSWORD=...
 * In production the seeder refuses to run unless SEED_ADMIN_PASSWORD is set.
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminPassword = env('SEED_ADMIN_PASSWORD');
        $userPassword = env('SEED_USER_PASSWORD', 'password123');

        if (app()->isProduction() && !$adminPassword) {
            $this->command?->error('Refusing to seed in production without SEED_ADMIN_PASSWORD.');
            return;
        }
        $adminPassword ??= 'password123';

        $users = [
            // role      name                 email                       password
            ['admin',  'Harriet Admin',     'admin@example.com',        $adminPassword],
            ['parent', 'Grace Nakato',      'parent1@example.com',      $userPassword],
            ['parent', 'Joseph Okello',     'parent2@example.com',      $userPassword],
            ['pupil',  'Aisha Namukasa',    'pupil1@example.com',       $userPassword],
            ['pupil',  'Brian Mugisha',     'pupil2@example.com',       $userPassword],
            ['pupil',  'Cynthia Atim',      'pupil3@example.com',       $userPassword],
        ];

        foreach ($users as [$role, $name, $email, $password]) {
            $user = User::firstOrNew(['email' => $email]);
            // forceFill: 'role' is deliberately not mass-assignable on the model.
            $user->forceFill([
                'name' => $name,
                'password' => Hash::make($password),
                'role' => $role,
            ])->save();
        }

        $this->command?->info('Seeded ' . count($users) . ' users (1 admin, 2 parents, 3 pupils).');
    }
}
