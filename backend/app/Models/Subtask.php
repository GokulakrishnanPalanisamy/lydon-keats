<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Lives in the tenant database (never central) — pinned explicitly so it
 * always queries whichever tenant TenantMiddleware configured for this
 * request, regardless of the app's overall default connection.
 */
#[Fillable(['task_id', 'name', 'description', 'estimated_time', 'estimated_time_unit', 'sort_order'])]
class Subtask extends Model
{
    protected $connection = 'tenant';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'estimated_time' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
