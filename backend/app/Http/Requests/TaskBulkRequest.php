<?php

namespace App\Http\Requests;

use App\Models\Technician;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TaskBulkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Same rules as TaskRequest, nested under "tasks.*." so React can map
     * each error back to the task (and subtask) index it belongs to.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'tasks' => ['required', 'array', 'min:1'],

            'tasks.*.id' => ['sometimes', 'nullable', 'integer', 'exists:tenant.tasks,id'],
            'tasks.*.name' => ['required', 'string', 'max:255'],
            'tasks.*.description' => ['required', 'string'],
            'tasks.*.work_tag_ids' => ['sometimes', 'array'],
            'tasks.*.work_tag_ids.*' => ['integer', 'exists:tenant.work_tags,id'],
            'tasks.*.frequency_id' => ['required', 'integer', 'exists:tenant.frequencies,id'],

            'tasks.*.subtasks' => ['required', 'array', 'min:1'],
            'tasks.*.subtasks.*.name' => ['required', 'string', 'max:255'],
            'tasks.*.subtasks.*.description' => ['nullable', 'string'],
            'tasks.*.subtasks.*.estimated_time' => ['required', 'integer', 'min:1'],
            'tasks.*.subtasks.*.estimated_time_unit' => ['required', 'string', Rule::in(['minutes', 'hours'])],

            'tasks.*.technician_ids' => ['sometimes', 'array'],
            'tasks.*.technician_ids.*' => [
                'integer',
                function ($attribute, $value, $fail) {
                    $organizationId = $this->user()->organization_id;

                    $belongs = Technician::where('id', $value)
                        ->whereHas('organizations', fn ($query) => $query->where('organizations.id', $organizationId))
                        ->exists();

                    if (! $belongs) {
                        $fail('The selected technician is not assigned to your organization.');
                    }
                },
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tasks.required' => 'At least one task is required.',
            'tasks.min' => 'At least one task is required.',
            'tasks.*.subtasks.required' => 'At least one subtask is required.',
            'tasks.*.subtasks.min' => 'At least one subtask is required.',
        ];
    }
}
