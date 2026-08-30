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
            'tasks' => TaskResource::collection(Task::with(['workTags', 'frequency', 'subtasks'])->latest()->get()),
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
        $model = Task::with(['workTags', 'frequency', 'subtasks'])->findOrFail($task);

        return response()->json([
            'task' => new TaskResource($model),
        ]);
    }

    /**
     * Admin-only (enforced by routes/api.php, not just hidden in the UI).
     * Saves the task, its work tags, and its subtasks in one transaction
     * — if anything fails, nothing is left partially created.
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

                $this->saveSubtasks($task, $data['subtasks']);

                return $task;
            });
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Could not create the task. Please try again.',
            ], 500);
        }

        return response()->json([
            'task' => new TaskResource($task->load(['workTags', 'frequency', 'subtasks'])),
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

                // Simplest correct approach: replace the subtask list
                // wholesale rather than diffing — the frontend always
                // sends the full desired list (new subtasks don't have
                // ids yet anyway).
                $model->subtasks()->delete();
                $this->saveSubtasks($model, $data['subtasks']);
            });
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Could not update the task. Please try again.',
            ], 500);
        }

        return response()->json([
            'task' => new TaskResource($model->load(['workTags', 'frequency', 'subtasks'])),
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

    /**
     * @param  array<int, array{name: string, description?: string|null, estimated_time: int, estimated_time_unit: string}>  $subtasks
     */
    private function saveSubtasks(Task $task, array $subtasks): void
    {
        foreach ($subtasks as $index => $subtask) {
            $task->subtasks()->create([
                'name' => $subtask['name'],
                'description' => $subtask['description'] ?? null,
                'estimated_time' => $subtask['estimated_time'],
                'estimated_time_unit' => $subtask['estimated_time_unit'],
                'sort_order' => $index + 1,
            ]);
        }
    }
}
