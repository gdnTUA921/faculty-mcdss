<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePositionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }


    public function rules(): array
    {
        return [
            'department_id' => ['sometimes', 'uuid', 'exists:departments,id'],
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string'],
            'target_applicant_type' => ['sometimes', Rule::in(['external', 'internal', 'both'])],
            'slots_available' => ['sometimes', 'integer', 'min:1'],
            'slots_filled' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(['open', 'closed', 'filled'])],
            'application_deadline' => ['sometimes', 'nullable', 'date'],
        ];
    }

}
