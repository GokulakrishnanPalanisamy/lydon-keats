<?php

use App\Http\Controllers\TechnicianController;
use App\Http\Controllers\TechnicianTaskController;
use Illuminate\Support\Facades\Route;

// Technician-only routes.

Route::post('/technician/register', [TechnicianController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/technician/organizations/{organization}/select', [TechnicianController::class, 'selectOrganization']);

    Route::middleware(['tenant', 'tenant.selected', 'technician'])->prefix('technician')->group(function () {
        Route::get('/tasks', [TechnicianTaskController::class, 'index']);
        Route::get('/tasks/{task}', [TechnicianTaskController::class, 'show']);
        Route::put('/tasks/{task}/status', [TechnicianTaskController::class, 'updateStatus']);
    });
});
