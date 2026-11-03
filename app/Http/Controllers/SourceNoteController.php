<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateQuestionsFromNote;
use App\Models\Question;
use App\Models\SourceNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Protect all routes with your admin middleware, e.g. ->middleware(['auth:sanctum', 'role:admin'])
class SourceNoteController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'class_level_id' => ['required', 'exists:class_levels,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'topic_id' => ['nullable', 'exists:topics,id'],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'min:50', 'max:60000'],
            'goals' => ['nullable', 'string', 'max:1000'],
            'questions_per_chunk' => ['nullable', 'integer', 'between:1,10'],
        ]);

        $note = SourceNote::create($data + ['uploaded_by' => $request->user()->id]);
        GenerateQuestionsFromNote::dispatch($note->id)->afterCommit();

        return response()->json(['id' => $note->id, 'status' => 'pending'], 202);
    }

    // Poll this from the admin screen.
    public function show(SourceNote $note): JsonResponse
    {
        return response()->json($note->load(['questions.options']));
    }

    public function regenerate(SourceNote $note): JsonResponse
    {
        $note->update(['status' => 'pending', 'error' => null]);
        GenerateQuestionsFromNote::dispatch($note->id);
        return response()->json(['status' => 'pending'], 202);
    }

    public function approveAll(SourceNote $note): JsonResponse
    {
        $n = $note->questions()->where('status', 'draft')->update(['status' => 'approved']);
        return response()->json(['approved' => $n]);
    }

    public function setQuestionStatus(Request $request, Question $question): JsonResponse
    {
        $status = $request->validate(['status' => ['required', 'in:approved,rejected,draft']])['status'];
        $question->update(['status' => $status]);
        return response()->json($question->fresh('options'));
    }
}
