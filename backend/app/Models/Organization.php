<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'status', 'admin_user_id', 'database_host', 'database_name', 'database_username', 'database_password'])]
#[Hidden(['database_host', 'database_name', 'database_username', 'database_password'])]
class Organization extends Model
{
    protected $connection = 'central';

    /**
     * The tenant database password is encrypted at rest, on top of never
     * being exposed in API responses (see the #[Hidden] attribute above).
     */
    protected function casts(): array
    {
        return [
            'database_password' => 'encrypted',
        ];
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
