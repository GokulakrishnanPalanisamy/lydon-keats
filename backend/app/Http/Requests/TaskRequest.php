<?php

namespace App\Http\Requests;

use App\Models\Technician;
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

            'technician_ids' => ['sometimes', 'array'],
            'technician_ids.*' => [
                'integer',
                // Technician lives in the central database, so this can't
                // be a plain exists:tenant.* rule. Checked explicitly
                // instead: the technician must be a real account AND
                // already assigned to the authenticated admin's own
                // organization — never trust an id alone.
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
            'subtasks.required' => 'At least one subtask is required.',
            'subtasks.min' => 'At least one subtask is required.',
        ];
    }
}
