<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WorkTagRequest extends FormRequest
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
            'name' => [
                'required',
                'string',
                'max:255',
                // {workTag} is a raw id here (see WorkTagController — the
                // model is resolved manually, not via implicit binding).
                Rule::unique('tenant.work_tags', 'name')->ignore($this->route('workTag')),
            ],
        ];
    }
}
