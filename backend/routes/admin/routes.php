<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TechnicianController;
use App\Http\Controllers\WorkTagController;
use Illuminate\Support\Facades\Route;

// Admin-only routes. Routes shared with technicians (login, logout, me,
// work-tag/task reads) live in routes/common/routes.php.

Route::post('/register', [AuthController::class, 'register']);

// Admin-only writes, under /admin — enforced server-side, not just hidden in the UI.
Route::middleware(['auth:sanctum', 'tenant', 'tenant.selected', 'admin'])->prefix('admin')->group(function () {
    Route::post('/work-tags', [WorkTagController::class, 'store']);
    Route::put('/work-tags/{workTag}', [WorkTagController::class, 'update']);
    Route::delete('/work-tags/{workTag}', [WorkTagController::class, 'destroy']);

    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

    Route::get('/technicians', [TechnicianController::class, 'search']);
    Route::post('/technicians/{technician}/assign', [TechnicianController::class, 'assign']);
});
