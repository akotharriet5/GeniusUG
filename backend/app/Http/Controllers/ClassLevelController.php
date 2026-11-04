<?php

namespace App\Http\Controllers;

use App\Models\ClassLevel;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClassLevelController extends Controller
{
    public function index()
    {
        return ClassLevel::withCount('topics')->orderBy('sort_order')->orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50', 'unique:class_levels,name'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);
        return response()->json(ClassLevel::create($data), 201);
    }

    public function show(ClassLevel $classLevel)
    {
        return $classLevel->loadCount('topics');
    }

    public function update(Request $request, ClassLevel $classLevel)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50', Rule::unique('class_levels', 'name')->ignore($classLevel->id)],
            'description' => ['nullable', 'string', 'max:500'],
        ]);
        $classLevel->update($data);
        return $classLevel->loadCount('topics');
    }

    public function destroy(ClassLevel $classLevel)
    {
        if ($classLevel->topics()->exists()) {
            return response()->json(['message' => 'Delete this class\'s topics first.'], 409);
        }
        $classLevel->delete();
        return response()->noContent();
    }
}
