<?php

namespace App\Http\Controllers;

use App\Http\Requests\WorkTagRequest;
use App\Http\Resources\WorkTagResource;
use App\Models\WorkTag;
use Illuminate\Http\JsonResponse;

class WorkTagController extends Controller
{
    /**
     * To fetch all worktags. (organization will be assigned in middleware)
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'work_tags' => WorkTagResource::collection(WorkTag::orderBy('name')->get()),
        ]);
    }

    /**
     * To fetch single worktags. (organization will be assigned in middleware)
     */
    public function show(string $workTag): JsonResponse
    {
        $model = WorkTag::findOrFail($workTag);

        return response()->json([
            'work_tag' => new WorkTagResource($model),
        ]);
    }

    /**
     * To store the worktag. (organization will be assigned in middleware)
     */
    public function store(WorkTagRequest $request): JsonResponse
    {
        $workTag = WorkTag::create($request->validated());

        return response()->json([
            'work_tag' => new WorkTagResource($workTag),
        ], 201);
    }

    /**
     * To update the worktags. (organization will be assigned in middleware)
     */
    public function update(WorkTagRequest $request, string $workTag): JsonResponse
    {
        $model = WorkTag::findOrFail($workTag);
        $model->update($request->validated());

        return response()->json([
            'work_tag' => new WorkTagResource($model),
        ]);
    }

    /**
     * To delete the worktags. (organization will be assigned in middleware)
     */
    public function destroy(string $workTag): JsonResponse
    {
        $model = WorkTag::findOrFail($workTag);
        $model->delete();

        return response()->json([
            'message' => 'Work tag deleted.',
        ]);
    }
}
