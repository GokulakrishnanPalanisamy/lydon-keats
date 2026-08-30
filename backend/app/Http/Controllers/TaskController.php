<?php

namespace App\Http\Controllers;

use App\Http\Requests\TaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class TaskController extends Controller
{
    /**
     * List tasks for the currently selected organization's tenant
     * database. Readable by admins and technicians (with a selected
     * organization) alike — see routes/api.php.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'tasks' => TaskResource::collection(Task::with(['workTags', 'frequency'])->latest()->get()),
        ]);
    }

    /**
     * Note: {task} is resolved manually (findOrFail) rather than via
     * implicit route-model-binding. Laravel resolves implicit bindings in
     * SubstituteBindings, which runs before this route's own 'tenant'
     * middleware — too early for a model pinned to the "tenant"
     * connection, since that connection isn't configured yet at that
     * point. Resolving it here instead, inside the action, guarantees the
     * tenant connection is already set up first.
     */
    public function show(string $task): JsonResponse
    {
        $model = Task::with(['workTags', 'frequency'])->findOrFail($task);

        return response()->json([
            'task' => new TaskResource($model),
        ]);
    }

    /**
     * Admin-only (enforced by routes/api.php, not just hidden in the UI).
     * Saves the task and attaches its work tags in one transaction — if
     * anything fails, neither is left partially created.
     */
    public function store(TaskRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $task = DB::connection('tenant')->transaction(function () use ($data) {
                $task = Task::create([
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'frequency_id' => $data['frequency_id'],
                ]);

                $task->workTags()->attach($data['work_tag_ids'] ?? []);

                return $task;
            });
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Could not create the task. Please try again.',
            ], 500);
        }

        return response()->json([
            'task' => new TaskResource($task->load(['workTags', 'frequency'])),
        ], 201);
    }

    public function update(TaskRequest $request, string $task): JsonResponse
    {
        $model = Task::findOrFail($task);
        $data = $request->validated();

        try {
            DB::connection('tenant')->transaction(function () use ($data, $model) {
                $model->update([
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'frequency_id' => $data['frequency_id'],
                ]);

                $model->workTags()->sync($data['work_tag_ids'] ?? []);
            });
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Could not update the task. Please try again.',
            ], 500);
        }

        return response()->json([
            'task' => new TaskResource($model->load(['workTags', 'frequency'])),
        ]);
    }

    public function destroy(string $task): JsonResponse
    {
        $model = Task::findOrFail($task);
        $model->delete();

        return response()->json([
            'message' => 'Task deleted.',
        ]);
    }
}
