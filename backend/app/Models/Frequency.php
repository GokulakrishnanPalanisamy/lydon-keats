<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Lives in the tenant database (never central) — pinned explicitly so it
 * always queries whichever tenant TenantMiddleware configured for this
 * request, regardless of the app's overall default connection.
 */
#[Fillable(['name', 'description'])]
class Frequency extends Model
{
    protected $connection = 'tenant';

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
