<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['internal_applicant', 'external_applicant'], true);
    }

    public function rules(): array
    {
        return [
            'responses' => ['required', 'array', 'min:1'],
            'responses.*.criterion_id' => ['required', 'uuid', 'exists:criteria,id'],
            'responses.*.raw_value' => ['nullable', 'string'],
        ];
    }
}
