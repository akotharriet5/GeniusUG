<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassLevel extends Model
{
    protected $fillable = ['name', 'description', 'sort_order'];

    public function topics(): HasMany { return $this->hasMany(Topic::class); }
}
