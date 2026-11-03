<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    protected $fillable = [
        'source_note_id', 'topic_id', 'topic_hint', 'type', 'stem', 'hint',
        'explanation', 'source_quote', 'status', 'content_hash',
    ];

    public function sourceNote(): BelongsTo { return $this->belongsTo(SourceNote::class); }
    public function options(): HasMany { return $this->hasMany(QuestionOption::class)->orderBy('position'); }
}
