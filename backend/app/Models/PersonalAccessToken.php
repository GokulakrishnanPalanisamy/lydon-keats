<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

/**
 * Pinned to the central connection so that authentication tokens keep
 * working even after TenantMiddleware switches the default connection
 * to the tenant database for the rest of the request.
 */
class PersonalAccessToken extends SanctumPersonalAccessToken
{
    protected $connection = 'central';
}
