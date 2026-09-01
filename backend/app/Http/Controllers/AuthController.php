<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\AdminResource;
use App\Http\Resources\OrganizationResource;
use App\Http\Resources\TechnicianResource;
use App\Models\Admin;
use App\Models\Organization;
use App\Models\Role;
use App\Models\Technician;
use App\Services\TenantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Throwable;

class AuthController extends Controller
{
    public function __construct(private readonly TenantService $tenantService)
    {
    }

    /**
     * Registering new Organization with Admin User
     * and creating tenant database
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        // phase:1 central database register
        try {
            [$organization, $admin] = DB::connection('central')->transaction(function () use ($data) {
                // step:1 creating the organization first
                $organization = Organization::create([
                    'name' => $data['organization_name'],
                    'status' => 'active',
                ]);

                // step:2 getting admin role to assign for organization.
                $adminRole = Role::where('slug', 'admin')->firstOrFail();

                // step:3 creating admin user
                $admin = Admin::create([
                    'organization_id' => $organization->id,
                    'name' => $data['admin_name'],
                    'email' => $data['admin_email'],
                    'password' => Hash::make($data['password']),
                    'role_id' => $adminRole->id,
                    'status' => 'active',
                ]);

                $organization->update(['admin_id' => $admin->id]);

                return [$organization, $admin];
            });
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Registration failed. Please try again.',
            ], 500);
        }

        // phase:2 creating tenant database
        $databaseName = $this->tenantService->generateDatabaseName($organization);

        try {
            $this->tenantService->createDatabase($databaseName);

            $organization->update([
                'database_host' => config('database.connections.tenant.host'),
                'database_name' => $databaseName,
                'database_username' => config('database.connections.tenant.username'),
                'database_password' => config('database.connections.tenant.password'),
            ]);

            $this->tenantService->runMigrations($organization);
        } catch (Throwable $e) {
            $this->tenantService->dropDatabaseIfExists($databaseName);
            $organization->delete(); // cascades to delete the admin

            report($e);

            return response()->json([
                'message' => 'Registration failed while setting up the organization database. Please try again.',
            ], 500);
        }

        $token = $admin->createToken('auth_token')->plainTextToken;

        return response()->json([
            'type' => 'admin',
            'user' => new AdminResource($admin->load('role')),
            'organization' => new OrganizationResource($organization),
            'token' => $token,
        ], 201);
    }

    /**
     * Authenticate an admin or technician with email + password and issue
     * a Sanctum token. Both account types share this one endpoint.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $account = Admin::where('email', $credentials['email'])->first()
            ?? Technician::where('email', $credentials['email'])->first();

        if (! $account || ! Hash::check($credentials['password'], $account->password)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 401);
        }

        $token = $account->createToken('auth_token')->plainTextToken;

        if ($account instanceof Admin) {
            return response()->json([
                'type' => 'admin',
                'user' => new AdminResource($account->load('role')),
                'organization' => new OrganizationResource($account->organization),
                'token' => $token,
            ]);
        }

        return response()->json([
            'type' => 'technician',
            'user' => new TechnicianResource($account->load('role')),
            'organizations' => OrganizationResource::collection($this->technicianOrganizations($account)),
            'token' => $token,
        ]);
    }

    /**
     * Revoke the token used to authenticate the current request. Works the
     * same for both admins and technicians.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }


    public function me(Request $request): JsonResponse
    {
        $account = $request->user();

        if ($account instanceof Admin) {
            $account->load('role');
            $organization = Organization::find($account->organization_id);

            return response()->json([
                'type' => 'admin',
                'user' => new AdminResource($account),
                'organization' => new OrganizationResource($organization),
            ]);
        }

        $account->load('role');

        return response()->json([
            'type' => 'technician',
            'user' => new TechnicianResource($account),
            'organizations' => OrganizationResource::collection($this->technicianOrganizations($account)),
        ]);
    }

    /**
     * To fetch the Technicians organizations.
     */
    private function technicianOrganizations(Technician $technician)
    {
        return Technician::find($technician->id)->organizations;
    }
}
