<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\Topic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Flashcards (questions). Types stored in DB:
 *   mcq         = multiple choice (3 options, exactly 1 correct)
 *   true_false  = boolean (True/False, exactly 1 correct)
 *   text_input  = typed answer (1+ accepted answers, all marked correct)
 */
class QuestionController extends Controller
{
    public function index(Topic $topic)
    {
        return $topic->questions()->with('options')->orderBy('id')->get()->map(fn ($q) => $this->format($q));
    }

    public function store(Request $request, Topic $topic)
    {
        $data = $this->validated($request);
        $question = $this->save(new Question(['topic_id' => $topic->id]), $data);
        return response()->json($this->format($question), 201);
    }

    public function update(Request $request, Question $question)
    {
        $data = $this->validated($request);
        return $this->format($this->save($question, $data));
    }

    public function destroy(Question $question)
    {
        $question->delete();
        return response()->noContent();
    }

    /** Bulk-import JSON pasted from the playground. Imported cards start as drafts. */
    public function import(Request $request, Topic $topic)
    {
        $items = $request->validate(['questions' => ['required', 'array', 'max:200']])['questions'];

        $created = 0;
        $skipped = [];
        foreach ($items as $i => $item) {
            try {
                $data = $this->normalizeImport(is_array($item) ? $item : []);
                $this->checkOptions($data);

                $hash = $this->hash($data['stem']);
                if (Question::where('topic_id', $topic->id)->where('content_hash', $hash)->exists()) {
                    throw ValidationException::withMessages(['stem' => 'Duplicate question in this topic.']);
                }
                $this->save(new Question(['topic_id' => $topic->id]), $data + ['status' => 'draft']);
                $created++;
            } catch (ValidationException $e) {
                $skipped[] = ['index' => $i, 'reason' => collect($e->errors())->flatten()->first()];
            }
        }

        return response()->json(['created' => $created, 'skipped' => $skipped]);
    }

    // ---------- helpers ----------

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'stem' => ['required', 'string', 'max:300'],
            'type' => ['required', 'in:mcq,true_false,text_input'],
            'hint' => ['nullable', 'string', 'max:255'],
            'explanation' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', 'in:draft,approved,rejected'],
            'options' => ['required', 'array', 'min:1', 'max:6'],
            'options.*.text' => ['required', 'string', 'max:255'],
            'options.*.is_correct' => ['nullable', 'boolean'],
        ]);
        $this->checkOptions($data);
        return $data;
    }

    /** Type-specific rules that plain validation can't express. */
    private function checkOptions(array $d): void
    {
        $opts = $d['options'] ?? [];
        $correct = count(array_filter($opts, fn ($o) => !empty($o['is_correct'])));
        $fail = fn ($m) => throw ValidationException::withMessages(['options' => $m]);

        switch ($d['type']) {
            case 'mcq':
                if (count($opts) < 2 || count($opts) > 4) $fail('Multiple choice needs 2 to 4 options.');
                if ($correct !== 1) $fail('Multiple choice needs exactly one correct option.');
                break;
            case 'true_false':
                $texts = collect($opts)->pluck('text')->map(fn ($t) => strtolower(trim($t)))->sort()->values()->all();
                if ($texts !== ['false', 'true']) $fail('Boolean needs exactly the options True and False.');
                if ($correct !== 1) $fail('Pick either True or False as the answer.');
                break;
            case 'text_input':
                if ($correct !== count($opts)) $fail('Every text-input answer must be an accepted answer.');
                break;
        }

        $norm = collect($opts)->pluck('text')->map(fn ($t) => mb_strtolower(trim($t)));
        if ($norm->unique()->count() !== $norm->count()) $fail('Options must be different from each other.');
    }

    private function save(Question $question, array $d): Question
    {
        return DB::transaction(function () use ($question, $d) {
            $question->fill([
                'type' => $d['type'],
                'stem' => trim($d['stem']),
                'hint' => $d['hint'] ?? null,
                'explanation' => $d['explanation'] ?? null,
                'status' => $d['status'] ?? $question->status ?? 'approved',
                'content_hash' => $this->hash($d['stem']),
            ])->save();

            $question->options()->delete();
            foreach (array_values($d['options']) as $pos => $o) {
                $question->options()->create([
                    'text' => trim($o['text']),
                    'is_correct' => !empty($o['is_correct']),
                    'position' => $pos,
                ]);
            }
            return $question->load('options');
        });
    }

    private function hash(string $stem): string
    {
        return hash('sha256', mb_strtolower(trim(preg_replace('/\s+/u', ' ', $stem))));
    }

    private function format(Question $q): array
    {
        return [
            'id' => $q->id,
            'topic_id' => $q->topic_id,
            'stem' => $q->stem,
            'type' => $q->type,
            'hint' => $q->hint,
            'explanation' => $q->explanation,
            'status' => $q->status,
            'options' => $q->options->map(fn ($o) => ['text' => $o->text, 'is_correct' => $o->is_correct])->values(),
            'correct_answer' => $q->options->where('is_correct', true)->pluck('text')->implode(' / '),
        ];
    }

    /**
     * Accepts the shapes a playground model is likely to return, e.g.
     *  {"question":"...","type":"multiple_choice","options":["a","b","c"],"answer":"a"}
     *  {"stem":"...","type":"mcq","options":[{"text":"a","correct":true},...]}
     *  {"question":"...","type":"boolean","answer":true}
     */
    private function normalizeImport(array $item): array
    {
        $typeMap = [
            'mcq' => 'mcq', 'multiple_choice' => 'mcq', 'multiple-choice' => 'mcq', 'multiplechoice' => 'mcq',
            'true_false' => 'true_false', 'true-false' => 'true_false', 'boolean' => 'true_false',
            'text_input' => 'text_input', 'text-input' => 'text_input', 'text' => 'text_input',
        ];
        $type = $typeMap[strtolower((string) ($item['type'] ?? ''))] ?? null;
        $stem = trim((string) ($item['stem'] ?? $item['question'] ?? ''));
        $answer = $item['answer'] ?? $item['correct_answer'] ?? $item['correctAnswer'] ?? null;

        if (!$type) throw ValidationException::withMessages(['type' => 'Unknown or missing type.']);
        if ($stem === '') throw ValidationException::withMessages(['stem' => 'Missing question text.']);

        $options = [];
        if ($type === 'true_false') {
            $isTrue = is_bool($answer) ? $answer : in_array(strtolower((string) $answer), ['true', 't', 'yes'], true);
            $options = [['text' => 'True', 'is_correct' => $isTrue], ['text' => 'False', 'is_correct' => !$isTrue]];
        } elseif ($type === 'text_input') {
            foreach ((array) $answer as $a) $options[] = ['text' => trim((string) $a), 'is_correct' => true];
        } else {
            $letters = ['a' => 0, 'b' => 1, 'c' => 2, 'd' => 3];
            foreach (array_values((array) ($item['options'] ?? [])) as $idx => $o) {
                if (is_array($o)) {
                    $options[] = ['text' => trim((string) ($o['text'] ?? '')), 'is_correct' => (bool) ($o['correct'] ?? $o['is_correct'] ?? false)];
                } else {
                    $text = trim((string) $o);
                    $isAnswer = is_string($answer) && (
                        mb_strtolower(trim($answer)) === mb_strtolower($text)
                        || (isset($letters[strtolower(trim($answer))]) && $letters[strtolower(trim($answer))] === $idx)
                    );
                    $options[] = ['text' => $text, 'is_correct' => $isAnswer];
                }
            }
        }

        return [
            'type' => $type,
            'stem' => $stem,
            'hint' => isset($item['hint']) ? mb_substr((string) $item['hint'], 0, 255) : null,
            'explanation' => isset($item['explanation']) ? mb_substr((string) $item['explanation'], 0, 500) : null,
            'options' => $options,
        ];
    }
}
