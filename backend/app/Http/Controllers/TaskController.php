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
     * To get all the tasks (organization will be assigned in middleware)
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'tasks' => TaskResource::collection(
                Task::with(['workTags', 'frequency', 'subtasks', 'taskTechnicians'])->latest()->get()
            ),
        ]);
    }

    /**
     * To get the single task (organization will be assigned in middleware)
     */
    public function show(string $task): JsonResponse
    {
        $model = Task::with(['workTags', 'frequency', 'subtasks', 'taskTechnicians'])->findOrFail($task);

        return response()->json([
            'task' => new TaskResource($model),
        ]);
    }

    /**
     * To store the task (with its worktags, subtasks, technicians)
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

                $this->syncTechnicians($task, $data['technician_ids'] ?? []);

                return $task;
            });
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Could not create the task. Please try again.',
            ], 500);
        }

        return response()->json([
            'task' => new TaskResource($task->load(['workTags', 'frequency', 'subtasks', 'taskTechnicians'])),
        ], 201);
    }

    /**
     * To update the task
     */
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

                // deleting the subtask and saving the new (approach for performance)
                $model->subtasks()->delete();
                $this->saveSubtasks($model, $data['subtasks']);

                $this->syncTechnicians($model, $data['technician_ids'] ?? []);
            });
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Could not update the task. Please try again.',
            ], 500);
        }

        return response()->json([
            'task' => new TaskResource($model->load(['workTags', 'frequency', 'subtasks', 'taskTechnicians'])),
        ]);
    }

    /**
     * To delete Task.
     */
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

    /**
     * To sync task and technicians ids.
     *
     * @param  array<int, int>  $technicianIds
     */
    private function syncTechnicians(Task $task, array $technicianIds): void
    {
        $existingIds = $task->taskTechnicians()->pluck('technician_id')->all();

        $task->taskTechnicians()->whereNotIn('technician_id', $technicianIds)->delete();

        foreach (array_diff($technicianIds, $existingIds) as $technicianId) {
            $task->taskTechnicians()->create([
                'technician_id' => $technicianId,
                'status' => 'assigned',
                'assigned_at' => now(),
            ]);
        }
    }
}
