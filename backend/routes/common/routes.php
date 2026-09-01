<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FrequencyController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\WorkTagController;
use Illuminate\Support\Facades\Route;

// common routes

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('tenant.selected')->group(function () {
        Route::get('/work-tags', [WorkTagController::class, 'index']);
        Route::get('/work-tags/{workTag}', [WorkTagController::class, 'show']);
        Route::get('/tasks', [TaskController::class, 'index']);
        Route::get('/tasks/{task}', [TaskController::class, 'show']);
        Route::get('/frequencies', [FrequencyController::class, 'index']);
        Route::get('/frequencies/{frequency}', [FrequencyController::class, 'show']);
    });
});
