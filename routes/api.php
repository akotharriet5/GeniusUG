<?php
// ---- Paste into routes/api.php ----
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassLevelController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\SourceNoteController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TopicController;

Route::middleware('throttle:10,1')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);        // creates PARENT accounts only
    Route::post('setup-admin', [AuthController::class, 'setupAdmin']);   // only works while no admin exists
});
Route::get('setup-status', [AuthController::class, 'setupStatus']);

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('dashboard', DashboardController::class);

    Route::apiResource('class-levels', ClassLevelController::class);
    Route::apiResource('subjects', SubjectController::class);

    Route::get('class-levels/{classLevel}/topics', [TopicController::class, 'indexForClass']);
    Route::post('class-levels/{classLevel}/topics', [TopicController::class, 'store']);
    Route::get('topics/{topic}', [TopicController::class, 'show']);
    Route::put('topics/{topic}', [TopicController::class, 'update']);
    Route::delete('topics/{topic}', [TopicController::class, 'destroy']);

    Route::get('topics/{topic}/questions', [QuestionController::class, 'index']);
    Route::post('topics/{topic}/questions', [QuestionController::class, 'store']);
    Route::post('topics/{topic}/questions/import', [QuestionController::class, 'import']);
    Route::put('questions/{question}', [QuestionController::class, 'update']);
    Route::delete('questions/{question}', [QuestionController::class, 'destroy']);

    Route::post('source-notes', [SourceNoteController::class, 'store']);
    Route::get('source-notes/{note}', [SourceNoteController::class, 'show']);
    Route::post('source-notes/{note}/regenerate', [SourceNoteController::class, 'regenerate']);
    Route::post('source-notes/{note}/approve-all', [SourceNoteController::class, 'approveAll']);
    Route::patch('questions/{question}/status', [SourceNoteController::class, 'setQuestionStatus']);
});

// ---- bootstrap/app.php (Laravel 11+) inside ->withMiddleware(function (Middleware $middleware) { ... }) ----
//   $middleware->alias(['admin' => \App\Http\Middleware\EnsureAdmin::class]);
//
// ---- config/services.php ----
//   'llama' => ['key' => env('LLAMA_API_KEY'), 'base_url' => env('LLAMA_BASE_URL'), 'model' => env('LLAMA_MODEL'), 'timeout' => 90],
//
// ---- CORS: allow your admin origin in config/cors.php (e.g. http://localhost:5173) ----
