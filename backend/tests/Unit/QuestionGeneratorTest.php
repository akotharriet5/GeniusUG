<?php

namespace Tests\Unit;

use App\Models\ClassLevel;
use App\Models\SourceNote;
use App\Models\Subject;
use App\Services\QuestionGenerator;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuestionGeneratorTest extends TestCase
{
    private const NOTES = "A school is a place where children go to learn. Teachers help pupils to read and write.";

    private function note(): SourceNote
    {
        $n = new SourceNote(['goals' => 'Know what a school is']);
        $n->setRelation('classLevel', new ClassLevel(['name' => 'P1']));
        $n->setRelation('subject', new Subject(['name' => 'Literacy']));
        return $n;
    }

    private function fakeModel(array $questions): void
    {
        config(['services.llama' => ['key' => 'x', 'base_url' => 'https://llm.test/v1', 'model' => 'm']]);
        Http::fake(['llm.test/*' => Http::response([
            'choices' => [['message' => ['content' => json_encode(['questions' => $questions])]]],
        ])]);
    }

    private function good(): array
    {
        return [
            'type' => 'mcq', 'topic' => 'Places', 'stem' => 'A ____ is a place where children go to learn.',
            'options' => [
                ['text' => 'a school', 'correct' => true],
                ['text' => 'a community', 'correct' => false],
                ['text' => 'a home', 'correct' => false],
            ],
            'source_quote' => 'A school is a place where children go to learn',
        ];
    }

    public function test_keeps_valid_and_drops_invalid_questions(): void
    {
        $twoCorrect = $this->good();
        $twoCorrect['stem'] = 'Another?';
        $twoCorrect['options'][1]['correct'] = true;

        $hallucinated = $this->good();
        $hallucinated['stem'] = 'Who built it?';
        $hallucinated['source_quote'] = 'The school was built in 1962 by the government';

        $this->fakeModel([$this->good(), $twoCorrect, $hallucinated]);

        $out = (new QuestionGenerator)->generate($this->note(), self::NOTES, 5);

        $this->assertCount(1, $out);
        $this->assertSame('mcq', $out[0]['type']);
    }

    public function test_accepts_true_false(): void
    {
        $this->fakeModel([[
            'type' => 'true_false', 'stem' => 'Children go to school to learn.',
            'options' => [['text' => 'False', 'correct' => false], ['text' => 'True', 'correct' => true]],
            'source_quote' => 'children go to learn',
        ]]);

        $out = (new QuestionGenerator)->generate($this->note(), self::NOTES, 5);

        $this->assertCount(1, $out);
        $this->assertSame('True', $out[0]['options'][0]['text']);
    }

    public function test_chunking_respects_max_size(): void
    {
        $text = implode("\n\n", array_fill(0, 10, str_repeat('word ', 100)));
        foreach ((new QuestionGenerator)->chunk($text, 1200) as $c) {
            $this->assertLessThanOrEqual(1200, mb_strlen($c));
        }
    }
}
