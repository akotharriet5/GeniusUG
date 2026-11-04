<?php

namespace App\Jobs;

use App\Models\Question;
use App\Models\SourceNote;
use App\Services\QuestionGenerator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class GenerateQuestionsFromNote implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 600;
    public array $backoff = [30, 120];

    public function __construct(public int $sourceNoteId) {}

    public function handle(QuestionGenerator $generator): void
    {
        $note = SourceNote::with(['classLevel', 'subject'])->findOrFail($this->sourceNoteId);
        $note->update(['status' => 'processing', 'error' => null]);

        $errors = [];
        foreach ($generator->chunk($note->body) as $i => $chunk) {
            try {
                $items = $generator->generate($note, $chunk, $note->questions_per_chunk);
                $this->persist($note, $items);
            } catch (Throwable $e) {
                // One bad chunk shouldn't sink the whole note.
                $errors[] = 'Chunk ' . ($i + 1) . ': ' . $e->getMessage();
                report($e);
            }
        }

        $total = $note->questions()->count();

        if ($total === 0) {
            // Nothing saved at all: let the queue retry (idempotent thanks to content_hash).
            throw new RuntimeException($errors ? implode(' | ', $errors) : 'No valid questions could be generated from these notes.');
        }

        $note->update([
            'status' => 'done',
            'generated_count' => $total,
            'error' => $errors ? implode("\n", $errors) : null,
        ]);
    }

    public function failed(Throwable $e): void
    {
        SourceNote::whereKey($this->sourceNoteId)->update([
            'status' => 'failed',
            'error' => mb_substr($e->getMessage(), 0, 1000),
        ]);
    }

    private function persist(SourceNote $note, array $items): void
    {
        DB::transaction(function () use ($note, $items) {
            foreach ($items as $item) {
                if (Question::where('source_note_id', $note->id)->where('content_hash', $item['content_hash'])->exists()) {
                    continue; // duplicate or retry
                }

                $question = Question::create([
                    'source_note_id' => $note->id,
                    'topic_id' => $note->topic_id,
                    'topic_hint' => $item['topic_hint'],
                    'type' => $item['type'],
                    'stem' => $item['stem'],
                    'hint' => $item['hint'],
                    'explanation' => $item['explanation'],
                    'source_quote' => $item['source_quote'],
                    'status' => 'draft',                // admin must approve before pupils see it
                    'content_hash' => $item['content_hash'],
                ]);

                $options = $item['options'];
                if ($item['type'] === 'mcq') shuffle($options); // avoid "correct is always first"

                foreach ($options as $pos => $o) {
                    $question->options()->create([
                        'text' => $o['text'],
                        'is_correct' => $o['is_correct'],
                        'position' => $pos,
                    ]);
                }
            }
        });
    }
}
