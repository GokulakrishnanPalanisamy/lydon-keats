<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('app:tenants-reset')]
#[Description('Command description')]
class TenantsReset extends Command
{
    protected $signature = 'tenants:reset';

    protected $description = 'Delete all tenant databases';

    public function handle(): int
    {
        if (! $this->confirm('Are you sure you want to delete ALL tenant databases?')) {
            $this->info('Cancelled.');

            return self::SUCCESS;
        }

        $databases = DB::select("
            SELECT SCHEMA_NAME
            FROM INFORMATION_SCHEMA.SCHEMATA
            WHERE SCHEMA_NAME LIKE 'tenant_%'
        ");

        foreach ($databases as $database) {
            $name = $database->SCHEMA_NAME;

            DB::statement("DROP DATABASE `{$name}`");

            $this->info("Deleted: {$name}");
        }

        $this->info('All tenant databases deleted.');

        return self::SUCCESS;
    }
}
