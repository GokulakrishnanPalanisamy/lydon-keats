<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'work_tag_ids' => ['sometimes', 'array'],
            // "tenant.work_tags" / "tenant.frequencies" — validated
            // against the CURRENT tenant connection, so a task can never
            // reference another organization's work tag or frequency.
            'work_tag_ids.*' => ['integer', 'exists:tenant.work_tags,id'],
            'frequency_id' => ['required', 'integer', 'exists:tenant.frequencies,id'],

            'subtasks' => ['required', 'array', 'min:1'],
            'subtasks.*.name' => ['required', 'string', 'max:255'],
            'subtasks.*.description' => ['nullable', 'string'],
            'subtasks.*.estimated_time' => ['required', 'integer', 'min:1'],
            'subtasks.*.estimated_time_unit' => ['required', 'string', Rule::in(['minutes', 'hours'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'subtasks.required' => 'At least one subtask is required.',
            'subtasks.min' => 'At least one subtask is required.',
        ];
    }
}
