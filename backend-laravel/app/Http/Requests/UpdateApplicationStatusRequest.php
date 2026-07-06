<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateApplicationStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:for_interview,for_review,hired,rejected,withdrawn'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
