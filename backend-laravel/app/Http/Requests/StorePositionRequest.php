<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePositionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'department_id' => ['required', 'uuid', 'exists:departments,id'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'target_applicant_type' => ['required', 'in:external,internal,both'],
            'slots_available' => ['required', 'integer', 'min:1'],
            'status' => ['sometimes', 'in:open,closed,filled'],
        ];
    }

}
