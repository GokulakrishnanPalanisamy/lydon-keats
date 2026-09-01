<?php

namespace App\Http\Middleware;

use App\Models\Technician;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs after auth:sanctum. Blocks any authenticated account that isn't a
 * technician from technician-only routes.
 *
 * This is a genuine security boundary, not just tidiness: Admin and
 * Technician are separate central tables with independent id sequences,
 * so an Admin could share a numeric id with an unrelated Technician row.
 * Without this check, a technician-scoped query keyed only on
 * $request->user()->id could accidentally match another account type's
 * assignment data.
 */
class EnsureTechnician
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() instanceof Technician) {
            return response()->json([
                'message' => 'This action is only available to technicians.',
            ], 403);
        }

        return $next($request);
    }
}
