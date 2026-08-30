<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Lives in the tenant database (never central) — pinned explicitly so it
 * always queries whichever tenant TenantMiddleware configured for this
 * request, regardless of the app's overall default connection.
 */
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

    /**
     * Sums subtask estimated times, normalized to minutes. Requires
     * "subtasks" to already be loaded (e.g. via with('subtasks')) —
     * otherwise this lazy-loads it on demand.
     */
    public function totalEstimatedMinutes(): int
    {
        return $this->subtasks->sum(fn (Subtask $subtask) => $subtask->estimated_time_unit === 'hours'
            ? $subtask->estimated_time * 60
            : $subtask->estimated_time);
    }
}
