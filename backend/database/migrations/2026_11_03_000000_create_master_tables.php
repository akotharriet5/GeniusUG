<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Runs BEFORE the question-generation migration (000000 < 000001).
// Guards are here because you may already have some of these tables.
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('class_levels')) {
            Schema::create('class_levels', function (Blueprint $t) {
                $t->id();
                $t->string('name', 50)->unique();           // P1, P2 ...
                $t->string('description', 500)->nullable();
                $t->unsignedSmallInteger('sort_order')->default(0);
                $t->timestamps();
            });
        }

        if (!Schema::hasTable('subjects')) {
            Schema::create('subjects', function (Blueprint $t) {
                $t->id();
                $t->string('name', 100)->unique();          // Literacy, Mathematics ...
                $t->string('description', 500)->nullable();
                $t->timestamps();
            });
        }

        if (!Schema::hasTable('topics')) {
            Schema::create('topics', function (Blueprint $t) {
                $t->id();
                $t->foreignId('class_level_id')->constrained('class_levels');
                $t->foreignId('subject_id')->constrained('subjects');
                $t->string('name', 150);
                $t->string('description', 1000)->nullable();
                $t->unsignedSmallInteger('sort_order')->default(0);
                $t->timestamps();
                $t->unique(['class_level_id', 'subject_id', 'name']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('topics');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('class_levels');
    }
};
