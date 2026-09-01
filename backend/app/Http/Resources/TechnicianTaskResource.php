<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TechnicianTaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'frequency' => $this->whenLoaded('frequency', fn () => $this->frequency ? new FrequencyResource($this->frequency) : null),
            'work_tags' => WorkTagResource::collection($this->whenLoaded('workTags')),
            'subtasks' => SubtaskResource::collection($this->whenLoaded('subtasks')),
            'subtasks_count' => $this->whenLoaded('subtasks', fn () => $this->subtasks->count()),
            'total_estimated_minutes' => $this->whenLoaded('subtasks', fn () => $this->totalEstimatedMinutes()),
            // "taskTechnicians" is always eager-loaded pre-filtered to the
            // requesting technician (see TechnicianTaskController), so
            // there's ever at most one row here — their own assignment.
            'status' => $this->whenLoaded('taskTechnicians', fn () => $this->taskTechnicians->first()?->status ?? 'assigned'),
            'assigned_at' => $this->whenLoaded('taskTechnicians', fn () => $this->taskTechnicians->first()?->assigned_at),
            'created_at' => $this->created_at,
        ];
    }
}
