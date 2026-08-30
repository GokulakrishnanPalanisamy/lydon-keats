<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs after TenantMiddleware. Blocks tenant-data routes (work tags,
 * tasks, ...) when no tenant connection was actually configured for this
 * request — the only case this happens is a technician who hasn't
 * selected an organization yet (TenantMiddleware lets that through
 * rather than blocking, since it also guards central-only routes like
 * /me). Admins always have a tenant connection configured by this point.
 */
class EnsureTenantConnected
{
    public function handle(Request $request, Closure $next): Response
    {
        if (empty(config('database.connections.tenant.database'))) {
            return response()->json([
                'message' => 'Select an organization first.',
            ], 422);
        }

        return $next($request);
    }
}
