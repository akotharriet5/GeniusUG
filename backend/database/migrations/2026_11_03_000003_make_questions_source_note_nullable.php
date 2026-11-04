<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Use this ONLY if you already ran the original questions migration (where source_note_id was NOT NULL).
// Typed-in and imported flashcards have no source note, so the column must allow NULL.
return new class extends Migration {
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $t) {
            $t->dropForeign(['source_note_id']);
        });

        Schema::table('questions', function (Blueprint $t) {
            $t->unsignedBigInteger('source_note_id')->nullable()->change();
        });

        Schema::table('questions', function (Blueprint $t) {
            $t->foreign('source_note_id')->references('id')->on('source_notes')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $t) {
            $t->dropForeign(['source_note_id']);
        });
        Schema::table('questions', function (Blueprint $t) {
            $t->unsignedBigInteger('source_note_id')->nullable(false)->change();
        });
        Schema::table('questions', function (Blueprint $t) {
            $t->foreign('source_note_id')->references('id')->on('source_notes')->cascadeOnDelete();
        });
    }
};
