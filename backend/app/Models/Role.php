<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'slug'])]
class Role extends Model
{
    protected $connection = 'central';

    public function admins(): HasMany
    {
        return $this->hasMany(Admin::class);
    }

    public function technicians(): HasMany
    {
        return $this->hasMany(Technician::class);
    }
}
