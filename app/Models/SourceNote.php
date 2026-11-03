<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SourceNote extends Model
{
    protected $fillable = [
        'class_level_id', 'subject_id', 'topic_id', 'uploaded_by', 'title',
        'body', 'goals', 'questions_per_chunk', 'status', 'generated_count', 'error',
    ];

    public function classLevel(): BelongsTo { return $this->belongsTo(ClassLevel::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function topic(): BelongsTo { return $this->belongsTo(Topic::class); }
    public function questions(): HasMany { return $this->hasMany(Question::class); }
}
