<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\Organization;
use App\Models\Technician;
use App\Services\TenantService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs after auth:sanctum.
 *
 * Admins have a single, fixed organization, so this switches the default
 * database connection to it automatically on every request.
 *
 * Technicians can belong to several organizations, so there is no fixed
 * one to default to. Instead, the frontend sends an X-Organization-Id
 * header identifying which organization the technician is currently
 * working in (see AuthContext's axios interceptor). That id is never
 * trusted on its own — it is re-verified against technician_organizations
 * on every request before the tenant connection is switched. With no
 * header (or an unverified one), the request proceeds against the central
 * connection only — this middleware never blocks central-only routes
 * like /me or /logout.
 */
class TenantMiddleware
{
    public function __construct(private readonly TenantService $tenantService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof Admin) {
            return $this->handleAdmin($request, $next, $user);
        }

        if ($user instanceof Technician) {
            return $this->handleTechnician($request, $next, $user);
        }

        return $next($request);
    }

    private function handleAdmin(Request $request, Closure $next, Admin $admin): Response
    {
        // Queried directly (rather than via $admin->organization) so this
        // doesn't cache the relation onto the shared user instance that
        // controllers later serialize in the response.
        $organization = Organization::find($admin->organization_id);

        if (! $organization) {
            return response()->json([
                'message' => 'No organization found for this user.',
            ], 403);
        }

        $this->tenantService->configureConnection($organization);

        return $next($request);
    }

    private function handleTechnician(Request $request, Closure $next, Technician $technician): Response
    {
        $organizationId = $request->header('X-Organization-Id');

        if (! $organizationId) {
            return $next($request);
        }

        $organization = $technician->organizations()
            ->where('organizations.id', $organizationId)
            ->first();

        if (! $organization) {
            return response()->json([
                'message' => 'You are not assigned to this organization.',
            ], 403);
        }

        $this->tenantService->configureConnection($organization);

        return $next($request);
    }
}
