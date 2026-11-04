<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubjectController extends Controller
{
    public function index()
    {
        return Subject::withCount('topics')->orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:subjects,name'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);
        return response()->json(Subject::create($data), 201);
    }

    public function show(Subject $subject)
    {
        return $subject->loadCount('topics');
    }

    public function update(Request $request, Subject $subject)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('subjects', 'name')->ignore($subject->id)],
            'description' => ['nullable', 'string', 'max:500'],
        ]);
        $subject->update($data);
        return $subject->loadCount('topics');
    }

    public function destroy(Subject $subject)
    {
        if ($subject->topics()->exists()) {
            return response()->json(['message' => 'Delete this subject\'s topics first.'], 409);
        }
        $subject->delete();
        return response()->noContent();
    }
}
