<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionOption extends Model
{
    public $timestamps = false;
    protected $fillable = ['question_id', 'text', 'is_correct', 'position'];
    protected $casts = ['is_correct' => 'boolean'];
}
