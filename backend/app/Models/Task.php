<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
}
