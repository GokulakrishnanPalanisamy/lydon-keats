<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;


#[Fillable(['name', 'description'])]
class Frequency extends Model
{
    protected $connection = 'tenant';

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
