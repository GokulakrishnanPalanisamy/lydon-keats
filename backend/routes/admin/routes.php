<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FrequencyController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TechnicianController;
use App\Http\Controllers\WorkTagController;
use Illuminate\Support\Facades\Route;

// Admin-only routes.

Route::post('/register', [AuthController::class, 'register']);

Route::middleware(['auth:sanctum', 'tenant', 'tenant.selected', 'admin'])->prefix('admin')->group(function () {

    Route::post('/work-tags', [WorkTagController::class, 'store']);
    Route::put('/work-tags/{workTag}', [WorkTagController::class, 'update']);
    Route::delete('/work-tags/{workTag}', [WorkTagController::class, 'destroy']);

    Route::post('/tasks', [TaskController::class, 'store']);
    Route::post('/tasks/bulk', [TaskController::class, 'bulkStore']);
    Route::put('/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

    Route::post('/frequencies', [FrequencyController::class, 'store']);
    Route::put('/frequencies/{frequency}', [FrequencyController::class, 'update']);
    Route::delete('/frequencies/{frequency}', [FrequencyController::class, 'destroy']);

    Route::get('/technicians', [TechnicianController::class, 'search']);
    Route::post('/technicians/{technician}/assign', [TechnicianController::class, 'assign']);
});
