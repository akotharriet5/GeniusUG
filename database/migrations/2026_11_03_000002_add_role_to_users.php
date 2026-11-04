<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Skip/delete this if your users table already has a `role` column.
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $t) {
                $t->string('role', 20)->default('parent')->index();   // admin | parent | pupil
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'role')) {
            Schema::table('users', fn (Blueprint $t) => $t->dropColumn('role'));
        }
    }
};
