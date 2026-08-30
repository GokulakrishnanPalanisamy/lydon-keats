<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
        ];
    }
}
