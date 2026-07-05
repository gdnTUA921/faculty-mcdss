<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCriterionOptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'label' => ['sometimes', 'required', 'string', 'max:150'],
            'value' => ['sometimes', 'required', 'string', 'max:150'],
            'score_value' => ['sometimes', 'required', 'numeric', 'min:0', 'max:1'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}