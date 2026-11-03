<?php

namespace App\Services;

use App\Models\SourceNote;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Turns a chunk of teacher notes into validated flashcard questions
 * using a Llama model behind an OpenAI-style chat completions endpoint.
 */
class QuestionGenerator
{
    private const AGE_BY_CLASS = [
        'P1' => '6-year-old', 'P2' => '7-year-old', 'P3' => '8-year-old',
        'P4' => '9-year-old', 'P5' => '10-year-old', 'P6' => '11-year-old', 'P7' => '12-year-old',
    ];

    /** Split notes into paragraph-aligned chunks so each LLM call stays small and focused. */
    public function chunk(string $body, int $maxChars = 2500): array
    {
        $paragraphs = preg_split('/\R{2,}/u', trim($body)) ?: [];
        $chunks = [];
        $current = '';

        foreach ($paragraphs as $p) {
            $p = trim($p);
            if ($p === '') continue;

            if ($current !== '' && mb_strlen($current) + mb_strlen($p) + 2 > $maxChars) {
                $chunks[] = $current;
                $current = '';
            }
            // A single oversized paragraph is hard-split.
            while (mb_strlen($p) > $maxChars) {
                $chunks[] = mb_substr($p, 0, $maxChars);
                $p = mb_substr($p, $maxChars);
            }
            $current .= ($current === '' ? '' : "\n\n") . $p;
        }
        if (trim($current) !== '') $chunks[] = $current;

        return $chunks;
    }

    /** @return array<int, array> validated questions (may be fewer than $count) */
    public function generate(SourceNote $note, string $chunk, int $count = 5): array
    {
        $raw = $this->callModel($this->systemPrompt(), $this->userPrompt($note, $chunk, $count));
        $items = $this->extractQuestions($raw);

        $valid = [];
        $rejected = 0;
        foreach ($items as $item) {
            $q = $this->validate($item, $chunk);
            if ($q === null) { $rejected++; continue; }
            $valid[] = $q;
        }

        if ($rejected) {
            Log::info('QuestionGenerator rejected items', ['note' => $note->id, 'rejected' => $rejected, 'kept' => count($valid)]);
        }
        return $valid;
    }

    // ---------- Prompts ----------

    private function systemPrompt(): string
    {
        return <<<'TXT'
You are an experienced Ugandan primary school teacher who writes fun, clear revision flashcards for young children.
You ONLY use facts that are written in the notes you are given. Never add outside facts.
Use very simple English, short sentences, and child-friendly, local, familiar examples when the notes allow it.
You reply with JSON only: no markdown, no commentary.
TXT;
    }

    private function userPrompt(SourceNote $note, string $chunk, int $count): string
    {
        $class = $note->classLevel->name ?? 'P1';
        $age = self::AGE_BY_CLASS[strtoupper($class)] ?? '7-year-old';
        $subject = $note->subject->name ?? 'General';
        $goals = trim((string) $note->goals) !== '' ? $note->goals : 'Help the pupil remember the key ideas in the notes.';

        return <<<TXT
Class: {$class} (write for a {$age})
Subject: {$subject}
Learning goals: {$goals}

NOTES:
"""
{$chunk}
"""

Write up to {$count} flashcard questions from the NOTES. Mix types: mostly "mcq", and 1 "true_false" if the notes allow.

Rules:
- "mcq": exactly 3 options, exactly ONE correct. Wrong options must be plausible but clearly wrong according to the notes.
- Fill-in-the-blank style is welcome for mcq: use "____" in the stem.
- "true_false": the stem is a statement; options are exactly "True" and "False", one correct.
- "source_quote" must be copied EXACTLY, word for word, from the NOTES and must prove the correct answer.
- "explanation": one short, encouraging sentence (max 15 words) shown after the pupil answers.
- "hint": optional, max 8 words, must not give away the answer.
- Do not ask about anything not in the NOTES.

Return exactly this JSON shape:
{"questions":[
  {"type":"mcq","topic":"short topic label","stem":"A ____ is a place where children go to learn.",
   "options":[{"text":"a school","correct":true},{"text":"a community","correct":false},{"text":"a home","correct":false}],
   "hint":"Think about where teachers work","explanation":"Yes! Children learn at school.",
   "source_quote":"exact words from the notes"}
]}
TXT;
    }

    // ---------- Model call ----------

    private function callModel(string $system, string $user): string
    {
        $cfg = config('services.llama');
        if (empty($cfg['key'])) {
            throw new RuntimeException('LLAMA_API_KEY is not configured.');
        }

        $response = Http::withToken($cfg['key'])
            ->acceptJson()
            ->timeout($cfg['timeout'] ?? 90)
            ->retry(2, 1500, throw: false)
            ->post(rtrim($cfg['base_url'], '/') . '/chat/completions', [
                'model' => $cfg['model'],
                'temperature' => 0.4,
                'max_tokens' => 2000,
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $user],
                ],
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Model API error ' . $response->status() . ': ' . mb_substr($response->body(), 0, 300));
        }

        // OpenAI-compatible shape first, then Meta's native Llama API shape.
        $text = $response->json('choices.0.message.content')
            ?? $response->json('completion_message.content.text')
            ?? $response->json('completion_message.content');

        if (!is_string($text) || trim($text) === '') {
            throw new RuntimeException('Model returned an empty response.');
        }
        return $text;
    }

    // ---------- Parsing & validation ----------

    private function extractQuestions(string $raw): array
    {
        $raw = trim(preg_replace('/^```(?:json)?\s*|\s*```$/i', '', trim($raw)));

        $data = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE && preg_match('/\{.*\}/s', $raw, $m)) {
            $data = json_decode($m[0], true);
        }
        if (!is_array($data)) {
            throw new RuntimeException('Model did not return valid JSON.');
        }

        $list = $data['questions'] ?? (array_is_list($data) ? $data : []);
        return is_array($list) ? $list : [];
    }

    /** Returns a clean question array, or null if it fails any check. */
    public function validate(mixed $item, string $chunk): ?array
    {
        if (!is_array($item)) return null;

        $type = $item['type'] ?? null;
        $stem = trim((string) ($item['stem'] ?? ''));
        $options = $item['options'] ?? null;

        if (!in_array($type, ['mcq', 'true_false'], true)) return null;
        if ($stem === '' || mb_strlen($stem) > 300) return null;
        if (!is_array($options)) return null;

        $clean = [];
        $seen = [];
        $correct = 0;
        foreach ($options as $o) {
            if (!is_array($o)) return null;
            $text = trim((string) ($o['text'] ?? ''));
            if ($text === '' || mb_strlen($text) > 120) return null;
            $norm = $this->normalize($text);
            if (isset($seen[$norm])) return null;                  // duplicate options
            $seen[$norm] = true;
            $isCorrect = filter_var($o['correct'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $correct += $isCorrect ? 1 : 0;
            $clean[] = ['text' => $text, 'is_correct' => $isCorrect];
        }
        if ($correct !== 1) return null;                           // exactly one right answer

        if ($type === 'mcq' && count($clean) !== 3) return null;
        if ($type === 'true_false') {
            $keys = array_keys($seen);
            sort($keys);
            if (count($clean) !== 2 || $keys !== ['false', 'true']) return null;
            usort($clean, fn ($a, $b) => strcasecmp($b['text'], $a['text']));   // True first, then False
        }

        // Grounding check: the evidence must really appear in the notes.
        $quote = trim((string) ($item['source_quote'] ?? ''));
        if (mb_strlen($quote) < 8 || !str_contains($this->normalize($chunk), $this->normalize($quote))) return null;

        $hint = trim((string) ($item['hint'] ?? ''));
        $explanation = trim((string) ($item['explanation'] ?? ''));

        return [
            'type' => $type,
            'stem' => $stem,
            'topic_hint' => mb_substr(trim((string) ($item['topic'] ?? '')), 0, 120) ?: null,
            'options' => $clean,
            'hint' => $hint !== '' ? mb_substr($hint, 0, 255) : null,
            'explanation' => $explanation !== '' ? mb_substr($explanation, 0, 500) : null,
            'source_quote' => $quote,
            'content_hash' => hash('sha256', $this->normalize($stem)),
        ];
    }

    private function normalize(string $s): string
    {
        $s = mb_strtolower($s);
        $s = preg_replace('/[^\p{L}\p{N}\s_]/u', '', $s);
        return trim(preg_replace('/\s+/u', ' ', $s));
    }
}
