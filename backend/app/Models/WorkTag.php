<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['name'])]
class WorkTag extends Model
{
    protected $connection = 'tenant';

    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_work_tag')->withTimestamps();
    }
}
