<?php

namespace App\Http\Controllers;

use App\Http\Requests\FrequencyRequest;
use App\Http\Resources\FrequencyResource;
use App\Models\Frequency;
use Illuminate\Http\JsonResponse;

class FrequencyController extends Controller
{
    /**
     * List frequencies for the currently selected organization's tenant
     * database. Readable by admins and technicians (with a selected
     * organization) alike — see routes/common/routes.php.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'frequencies' => FrequencyResource::collection(Frequency::orderBy('name')->get()),
        ]);
    }

    /**
     * Note: {frequency} is resolved manually (findOrFail) rather than via
     * implicit route-model-binding. Laravel resolves implicit bindings in
     * SubstituteBindings, which runs before this route's own 'tenant'
     * middleware — too early for a model pinned to the "tenant"
     * connection, since that connection isn't configured yet at that
     * point. Resolving it here instead, inside the action, guarantees the
     * tenant connection is already set up first.
     */
    public function show(string $frequency): JsonResponse
    {
        $model = Frequency::findOrFail($frequency);

        return response()->json([
            'frequency' => new FrequencyResource($model),
        ]);
    }

    /**
     * Admin-only (enforced by routes/admin/routes.php, not just hidden in the UI).
     */
    public function store(FrequencyRequest $request): JsonResponse
    {
        $frequency = Frequency::create($request->validated());

        return response()->json([
            'frequency' => new FrequencyResource($frequency),
        ], 201);
    }

    public function update(FrequencyRequest $request, string $frequency): JsonResponse
    {
        $model = Frequency::findOrFail($frequency);
        $model->update($request->validated());

        return response()->json([
            'frequency' => new FrequencyResource($model),
        ]);
    }

    /**
     * Refuses to delete a frequency that's still assigned to tasks,
     * rather than silently orphaning them.
     */
    public function destroy(string $frequency): JsonResponse
    {
        $model = Frequency::findOrFail($frequency);

        if ($model->tasks()->exists()) {
            return response()->json([
                'message' => 'This frequency is currently assigned to tasks and cannot be deleted.',
            ], 422);
        }

        $model->delete();

        return response()->json([
            'message' => 'Frequency deleted.',
        ]);
    }
}
