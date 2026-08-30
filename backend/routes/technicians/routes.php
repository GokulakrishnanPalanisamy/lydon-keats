<?php

use App\Http\Controllers\TechnicianController;
use Illuminate\Support\Facades\Route;

// Technician-only routes. Routes technicians share with admins (login,
// logout, me, work-tag/task reads) live in routes/common/routes.php.

Route::post('/technician/register', [TechnicianController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    // A technician selects which of their assigned organizations to work
    // in. The organization id is always re-verified against
    // technician_organizations before the tenant connection is switched.
    Route::post('/technician/organizations/{organization}/select', [TechnicianController::class, 'selectOrganization']);
});
