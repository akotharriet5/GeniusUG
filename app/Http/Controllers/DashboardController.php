<?php

namespace App\Http\Controllers;

use App\Models\ClassLevel;
use App\Models\Question;
use App\Models\Subject;
use App\Models\Topic;

class DashboardController extends Controller
{
    public function __invoke()
    {
        return response()->json([
            'classes' => ClassLevel::count(),
            'subjects' => Subject::count(),
            'topics' => Topic::count(),
            'flashcards' => Question::count(),
            'flashcards_pending_review' => Question::where('status', 'draft')->count(),
        ]);
    }
}
