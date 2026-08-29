<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * No organization_id: a technician can be assigned to multiple
 * organizations through the technician_organizations pivot table.
 */
#[Fillable(['name', 'email', 'password', 'role_id', 'status'])]
#[Hidden(['password'])]
class Technician extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $connection = 'central';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'technician_organizations')->withTimestamps();
    }
}
