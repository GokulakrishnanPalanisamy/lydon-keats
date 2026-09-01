<?php

namespace App\Http\Controllers;

use App\Http\Resources\TechnicianTaskResource;
use App\Models\Task;
use App\Models\TaskTechnician;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TechnicianTaskController extends Controller
{
    /**
     * List tasks assigned to the authenticated technician within the
     * currently selected organization's tenant database (enforced by the
     * 'technician' + 'tenant' + 'tenant.selected' route middleware).
     * Supports search, status/frequency/work-tag filters, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $technicianId = $request->user()->id;

        $query = Task::whereHas('taskTechnicians', fn ($q) => $q->where('technician_id', $technicianId))
            ->with([
                'workTags',
                'frequency',
                'subtasks',
                'taskTechnicians' => fn ($q) => $q->where('technician_id', $technicianId),
            ]);

        if (($search = trim((string) $request->query('search', ''))) !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->whereHas(
                'taskTechnicians',
                fn ($q) => $q->where('technician_id', $technicianId)->where('status', $status)
            );
        }

        if ($frequencyId = $request->query('frequency_id')) {
            $query->where('frequency_id', $frequencyId);
        }

        if ($workTagId = $request->query('work_tag_id')) {
            $query->whereHas('workTags', fn ($q) => $q->where('work_tags.id', $workTagId));
        }

        $tasks = $query->latest()->paginate(10)->withQueryString();

        return response()->json([
            'tasks' => TechnicianTaskResource::collection($tasks),
            'meta' => [
                'current_page' => $tasks->currentPage(),
                'last_page' => $tasks->lastPage(),
                'total' => $tasks->total(),
            ],
        ]);
    }

    /**
     * Note: {task} is resolved manually rather than via implicit
     * route-model-binding — see TaskController for why (SubstituteBindings
     * runs before the tenant connection is configured). The whereHas
     * check here is the actual security boundary: it guarantees the task
     * both belongs to the current tenant (implicit — Task is pinned to
     * whichever tenant this request's connection points at) AND is
     * actually assigned to the authenticated technician — not just any
     * task that happens to exist in this tenant.
     */
    public function show(Request $request, string $task): JsonResponse
    {
        $technicianId = $request->user()->id;

        $model = $this->findAssignedTask($task, $technicianId);

        if (! $model) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        return response()->json([
            'task' => new TechnicianTaskResource($model),
        ]);
    }

    /**
     * Updates the authenticated technician's own progress on a task
     * (e.g. Start Task / Complete Task). Only affects their assignment
     * row — other technicians assigned to the same task are unaffected.
     */
    public function updateStatus(Request $request, string $task): JsonResponse
    {
        $technicianId = $request->user()->id;

        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(['assigned', 'in_progress', 'completed'])],
        ]);

        $assignment = TaskTechnician::where('task_id', $task)
            ->where('technician_id', $technicianId)
            ->first();

        if (! $assignment) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        $assignment->update(['status' => $data['status']]);

        return response()->json([
            'task' => new TechnicianTaskResource($this->findAssignedTask($task, $technicianId)),
        ]);
    }

    private function findAssignedTask(string $task, int $technicianId): ?Task
    {
        return Task::whereHas('taskTechnicians', fn ($q) => $q->where('technician_id', $technicianId))
            ->with([
                'workTags',
                'frequency',
                'subtasks',
                'taskTechnicians' => fn ($q) => $q->where('technician_id', $technicianId),
            ])
            ->find($task);
    }
}
