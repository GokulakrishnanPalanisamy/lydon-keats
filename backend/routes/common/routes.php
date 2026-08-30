<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\WorkTagController;
use Illuminate\Support\Facades\Route;

// Routes used by both admins and technicians. Admin-only routes live in
// routes/admin/routes.php, technician-only routes in
// routes/technicians/routes.php.

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Work tags & tasks live in the currently selected organization's
    // tenant database. Reads here are shared between admins and
    // technicians (with a selected organization); writes are admin-only
    // — see routes/admin/routes.php.
    Route::middleware('tenant.selected')->group(function () {
        Route::get('/work-tags', [WorkTagController::class, 'index']);
        Route::get('/work-tags/{workTag}', [WorkTagController::class, 'show']);
        Route::get('/tasks', [TaskController::class, 'index']);
        Route::get('/tasks/{task}', [TaskController::class, 'show']);
    });
});
