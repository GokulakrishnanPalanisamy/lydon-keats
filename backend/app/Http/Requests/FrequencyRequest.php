<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FrequencyRequest extends FormRequest
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
                // {frequency} is a raw id here (see FrequencyController —
                // the model is resolved manually, not via implicit binding).
                Rule::unique('tenant.frequencies', 'name')->ignore($this->route('frequency')),
            ],
            'description' => ['nullable', 'string'],
        ];
    }
}
