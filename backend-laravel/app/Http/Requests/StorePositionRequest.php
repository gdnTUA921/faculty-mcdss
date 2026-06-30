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
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'target_applicant_type' => ['required', 'in:external_applicant,internal_applicant,both'],
            'slots_available' => ['required', 'integer', 'min:1'],
            'status' => ['sometimes', 'in:draft,open,closed,filled'],
        ];
    }

}
