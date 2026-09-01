<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;


#[Fillable(['name', 'description', 'frequency_id'])]
class Task extends Model
{
    protected $connection = 'tenant';

    public function workTags(): BelongsToMany
    {
        return $this->belongsToMany(WorkTag::class, 'task_work_tag')->withTimestamps();
    }

    public function frequency(): BelongsTo
    {
        return $this->belongsTo(Frequency::class);
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(Subtask::class)->orderBy('sort_order');
    }


    public function taskTechnicians(): HasMany
    {
        return $this->hasMany(TaskTechnician::class);
    }


    public function totalEstimatedMinutes(): int
    {
        return $this->subtasks->sum(fn (Subtask $subtask) => $subtask->estimated_time_unit === 'hours'
            ? $subtask->estimated_time * 60
            : $subtask->estimated_time);
    }
}
