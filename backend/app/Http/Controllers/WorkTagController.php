<?php

namespace App\Http\Controllers;

use App\Http\Requests\WorkTagRequest;
use App\Http\Resources\WorkTagResource;
use App\Models\WorkTag;
use Illuminate\Http\JsonResponse;

class WorkTagController extends Controller
{
    /**
     * List work tags for the currently selected organization's tenant
     * database. Readable by admins and technicians (with a selected
     * organization) alike — see routes/api.php.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'work_tags' => WorkTagResource::collection(WorkTag::orderBy('name')->get()),
        ]);
    }

    /**
     * Note: {workTag} is resolved manually (findOrFail) rather than via
     * implicit route-model-binding. Laravel resolves implicit bindings in
     * SubstituteBindings, which runs before this route's own 'tenant'
     * middleware — too early for a model pinned to the "tenant"
     * connection, since that connection isn't configured yet at that
     * point. Resolving it here instead, inside the action, guarantees the
     * tenant connection is already set up first.
     */
    public function show(string $workTag): JsonResponse
    {
        $model = WorkTag::findOrFail($workTag);

        return response()->json([
            'work_tag' => new WorkTagResource($model),
        ]);
    }

    /**
     * Admin-only (enforced by routes/api.php, not just hidden in the UI).
     */
    public function store(WorkTagRequest $request): JsonResponse
    {
        $workTag = WorkTag::create($request->validated());

        return response()->json([
            'work_tag' => new WorkTagResource($workTag),
        ], 201);
    }

    public function update(WorkTagRequest $request, string $workTag): JsonResponse
    {
        $model = WorkTag::findOrFail($workTag);
        $model->update($request->validated());

        return response()->json([
            'work_tag' => new WorkTagResource($model),
        ]);
    }

    public function destroy(string $workTag): JsonResponse
    {
        $model = WorkTag::findOrFail($workTag);
        $model->delete();

        return response()->json([
            'message' => 'Work tag deleted.',
        ]);
    }
}
