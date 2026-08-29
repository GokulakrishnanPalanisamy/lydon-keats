<?php

namespace App\Http\Controllers;

use App\Http\Requests\TechnicianRegisterRequest;
use App\Http\Resources\OrganizationResource;
use App\Http\Resources\TechnicianResource;
use App\Models\Organization;
use App\Models\Role;
use App\Models\Technician;
use App\Services\TenantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class TechnicianController extends Controller
{
    public function __construct(private readonly TenantService $tenantService)
    {
    }

    /**
     * Register a technician. Technicians exist independently of any
     * organization — no organization is assigned at registration time.
     */
    public function register(TechnicianRegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $technicianRole = Role::where('slug', 'technician')->firstOrFail();

        $technician = Technician::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role_id' => $technicianRole->id,
            'status' => 'active',
        ]);

        $token = $technician->createToken('auth_token')->plainTextToken;

        return response()->json([
            'type' => 'technician',
            'user' => new TechnicianResource($technician->load('role')),
            'organizations' => [],
            'token' => $token,
        ], 201);
    }

    /**
     * A technician selects which of their assigned organizations to work
     * in. The organization id comes from the frontend, but it is never
     * trusted on its own — membership is always re-verified here against
     * technician_organizations before the tenant connection is switched.
     */
    public function selectOrganization(Request $request, Organization $organization): JsonResponse
    {
        $technician = $request->user();

        if (! $technician instanceof Technician) {
            return response()->json([
                'message' => 'This action is only available to technicians.',
            ], 403);
        }

        $isAssigned = $technician->organizations()
            ->where('organizations.id', $organization->id)
            ->exists();

        if (! $isAssigned) {
            return response()->json([
                'message' => 'You are not assigned to this organization.',
            ], 403);
        }

        $this->tenantService->configureConnection($organization);

        return response()->json([
            'organization' => new OrganizationResource($organization),
        ]);
    }

    /**
     * Admin-only: search technicians by name or email, regardless of
     * which organizations (if any) they're already assigned to.
     */
    public function search(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $technicians = Technician::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->with(['role', 'organizations'])
            ->orderBy('name')
            ->limit(50)
            ->get();

        return response()->json([
            'technicians' => TechnicianResource::collection($technicians),
        ]);
    }

    /**
     * Admin-only: assign a technician to the authenticated admin's own
     * organization. The organization is always derived from the
     * authenticated admin — never accepted from the request.
     */
    public function assign(Request $request, Technician $technician): JsonResponse
    {
        $organization = $request->user()->organization;

        $alreadyAssigned = $technician->organizations()
            ->where('organizations.id', $organization->id)
            ->exists();

        if ($alreadyAssigned) {
            return response()->json([
                'message' => 'Technician is already assigned to your organization.',
            ], 422);
        }

        $technician->organizations()->attach($organization->id);

        return response()->json([
            'message' => 'Technician assigned to your organization.',
            'technician' => new TechnicianResource($technician->load(['role', 'organizations'])),
        ]);
    }
}
