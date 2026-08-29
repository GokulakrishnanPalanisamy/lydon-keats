<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\Organization;
use App\Services\TenantService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs after auth:sanctum. Admins have a single, fixed organization, so
 * this switches the default database connection to it automatically on
 * every request. Technicians can belong to several organizations, so they
 * select one explicitly instead (see TechnicianController::selectOrganization)
 * — for them, this middleware is a no-op.
 */
class TenantMiddleware
{
    public function __construct(private readonly TenantService $tenantService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof Admin) {
            return $next($request);
        }

        // Queried directly (rather than via $user->organization) so this
        // doesn't cache the relation onto the shared user instance that
        // controllers later serialize in the response.
        $organization = Organization::find($user->organization_id);

        if (! $organization) {
            return response()->json([
                'message' => 'No organization found for this user.',
            ], 403);
        }

        $this->tenantService->configureConnection($organization);

        return $next($request);
    }
}
