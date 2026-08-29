<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\OrganizationResource;
use App\Http\Resources\UserResource;
use App\Models\Organization;
use App\Models\Role;
use App\Models\User;
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
     * Register a new organization together with its admin user, then
     * provision a dedicated tenant database for it.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Step 1: create the organization + admin user in the central
        // database. This part is truly transactional (plain INSERT/UPDATE
        // statements only), so it either fully commits or fully rolls back.
        try {
            [$organization, $user] = DB::connection('central')->transaction(function () use ($data) {
                $organization = Organization::create([
                    'name' => $data['organization_name'],
                    'status' => 'active',
                ]);

                $adminRole = Role::where('slug', 'admin')->firstOrFail();

                $user = User::create([
                    'organization_id' => $organization->id,
                    'name' => $data['admin_name'],
                    'email' => $data['admin_email'],
                    'password' => Hash::make($data['password']),
                    'role_id' => $adminRole->id,
                    'status' => 'active',
                ]);

                $organization->update(['admin_user_id' => $user->id]);

                return [$organization, $user];
            });
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Registration failed. Please try again.',
            ], 500);
        }

        // Step 2: provision the tenant database. "CREATE DATABASE" and the
        // migration runner are DDL statements, which MySQL always
        // auto-commits — they cannot be part of the transaction above. If
        // anything here fails, we clean up manually instead.
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
            $organization->delete(); // cascades to delete the admin user

            report($e);

            return response()->json([
                'message' => 'Registration failed while setting up the organization database. Please try again.',
            ], 500);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user->load('role')),
            'organization' => new OrganizationResource($organization),
            'token' => $token,
        ], 201);
    }

    /**
     * Authenticate a user with email + password and issue a Sanctum token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $organization = Organization::find($user->organization_id);

        return response()->json([
            'user' => new UserResource($user->load('role')),
            'organization' => new OrganizationResource($organization),
            'token' => $token,
        ]);
    }

    /**
     * Revoke the token used to authenticate the current request.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Return the authenticated user and their organization.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');
        $organization = Organization::find($user->organization_id);

        return response()->json([
            'user' => new UserResource($user),
            'organization' => new OrganizationResource($organization),
        ]);
    }
}
