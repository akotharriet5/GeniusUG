<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Topic extends Model
{
    protected $fillable = ['class_level_id', 'subject_id', 'name', 'description', 'sort_order'];

    public function classLevel(): BelongsTo { return $this->belongsTo(ClassLevel::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function questions(): HasMany { return $this->hasMany(Question::class); }
}
