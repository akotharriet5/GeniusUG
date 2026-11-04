<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Assumes you already have: users, class_levels (P1..P7), subjects, topics.
return new class extends Migration {
    public function up(): void
    {
        Schema::create('source_notes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('class_level_id')->constrained('class_levels');
            $t->foreignId('subject_id')->constrained('subjects');
            $t->foreignId('topic_id')->nullable()->constrained('topics')->nullOnDelete();
            $t->foreignId('uploaded_by')->constrained('users');
            $t->string('title');
            $t->longText('body');
            $t->text('goals')->nullable();                       // e.g. "Learn names of places in the community"
            $t->unsignedTinyInteger('questions_per_chunk')->default(5);
            $t->string('status', 20)->default('pending');       // pending|processing|done|failed
            $t->unsignedInteger('generated_count')->default(0);
            $t->text('error')->nullable();
            $t->timestamps();
        });

        Schema::create('questions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('source_note_id')->nullable()->constrained('source_notes')->cascadeOnDelete();  // null = typed manually
            $t->foreignId('topic_id')->nullable()->constrained('topics')->nullOnDelete();
            $t->string('topic_hint')->nullable();                // AI's suggested topic label
            $t->string('type', 20);                              // mcq|true_false|text_input
            $t->string('stem', 500);
            $t->string('hint', 255)->nullable();
            $t->string('explanation', 500)->nullable();          // shown after answering
            $t->text('source_quote')->nullable();                // evidence from the notes
            $t->string('status', 20)->default('draft');          // draft|approved|rejected
            $t->char('content_hash', 64);
            $t->timestamps();

            $t->unique(['source_note_id', 'content_hash']);
            $t->index(['status', 'topic_id', 'updated_at']);      // sync pull query
        });

        Schema::create('question_options', function (Blueprint $t) {
            $t->id();
            $t->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $t->string('text', 255);
            $t->boolean('is_correct')->default(false);
            $t->unsignedTinyInteger('position')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_options');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('source_notes');
    }
};
