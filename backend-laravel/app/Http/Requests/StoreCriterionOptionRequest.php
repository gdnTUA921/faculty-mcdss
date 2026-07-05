<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCriterionOptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:150'],
            'value' => ['required', 'string', 'max:150'],
            'score_value' => ['required', 'numeric', 'min:0', 'max:1'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}