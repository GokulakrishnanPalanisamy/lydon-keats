<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs after auth:sanctum. Blocks any authenticated account that isn't an
 * organization admin (e.g. a technician) from admin-only routes.
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() instanceof Admin) {
            return response()->json([
                'message' => 'This action is only available to organization admins.',
            ], 403);
        }

        return $next($request);
    }
}
