<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Keeps auth tokens on the central connection even after
        // TenantMiddleware switches the default connection to "tenant".
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
    }
}
