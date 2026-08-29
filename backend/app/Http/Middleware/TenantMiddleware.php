<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use App\Services\TenantService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs after auth:sanctum. Reads the authenticated user's organization and
 * switches the default database connection to that organization's tenant
 * database for the rest of the request.
 */
class TenantMiddleware
{
    public function __construct(private readonly TenantService $tenantService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        // Queried directly (rather than via $user->organization) so this
        // doesn't cache the relation onto the shared user instance that
        // controllers later serialize in the response.
        $organization = Organization::find($request->user()?->organization_id);

        if (! $organization) {
            return response()->json([
                'message' => 'No organization found for this user.',
            ], 403);
        }

        $this->tenantService->configureConnection($organization);

        return $next($request);
    }
}
