<?php

namespace App\Services;

use App\Models\Organization;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * Creates and connects to per-organization ("tenant") databases.
 */
class TenantService
{
    /**
     * Build a unique, deterministic database name for an organization.
     */
    public function generateDatabaseName(Organization $organization): string
    {
        return 'tenant_'. $organization->name. '_' . $organization->id;
    }

    /**
     * Physically create the tenant database on the MySQL server.
     */
    public function createDatabase(string $databaseName): void
    {
        DB::connection('central')->statement("CREATE DATABASE IF NOT EXISTS `{$databaseName}`");
    }

    /**
     * Drop a tenant database. Used to clean up after a failed registration.
     */
    public function dropDatabaseIfExists(string $databaseName): void
    {
        DB::connection('central')->statement("DROP DATABASE IF EXISTS `{$databaseName}`");
    }

    /**
     * Point the "tenant" connection at the given organization's database
     * and make it the default connection for the rest of the request.
     */
    public function configureConnection(Organization $organization): void
    {
        Config::set('database.connections.tenant.host', $organization->database_host);
        Config::set('database.connections.tenant.database', $organization->database_name);
        Config::set('database.connections.tenant.username', $organization->database_username);
        Config::set('database.connections.tenant.password', $organization->database_password);

        DB::purge('tenant');
        DB::reconnect('tenant');

        Config::set('database.default', 'tenant');
    }

    /**
     * Run the tenant migrations against the given organization's database.
     */
    public function runMigrations(Organization $organization): void
    {
        $this->configureConnection($organization);

        Artisan::call('migrate', [
            '--database' => 'tenant',
            '--path' => 'database/migrations/tenant',
            '--force' => true,
        ]);
    }
}
