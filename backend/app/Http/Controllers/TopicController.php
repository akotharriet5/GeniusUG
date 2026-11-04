<?php

namespace App\Http\Controllers;

use App\Models\ClassLevel;
use App\Models\Topic;
use Illuminate\Http\Request;

class TopicController extends Controller
{
    private function rules(): array
    {
        return [
            'subject_id' => ['required', 'exists:subjects,id'],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function indexForClass(ClassLevel $classLevel)
    {
        return $classLevel->topics()->with('subject:id,name')->withCount('questions')
            ->orderBy('sort_order')->orderBy('name')->get();
    }

    public function store(Request $request, ClassLevel $classLevel)
    {
        $topic = $classLevel->topics()->create($request->validate($this->rules()));
        return response()->json($topic->load('subject:id,name')->loadCount('questions'), 201);
    }

    public function show(Topic $topic)
    {
        return $topic->load(['classLevel:id,name', 'subject:id,name'])->loadCount('questions');
    }

    public function update(Request $request, Topic $topic)
    {
        $topic->update($request->validate($this->rules()));
        return $topic->load('subject:id,name')->loadCount('questions');
    }

    public function destroy(Topic $topic)
    {
        if ($topic->questions()->exists()) {
            return response()->json(['message' => 'Delete this topic\'s flashcards first.'], 409);
        }
        $topic->delete();
        return response()->noContent();
    }
}
