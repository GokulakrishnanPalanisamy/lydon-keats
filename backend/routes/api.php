<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TechnicianController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/technician/register', [TechnicianController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::middleware('tenant')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    Route::post('/technician/organizations/{organization}/select', [TechnicianController::class, 'selectOrganization']);

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/technicians', [TechnicianController::class, 'search']);
        Route::post('/technicians/{technician}/assign', [TechnicianController::class, 'assign']);
    });
});
