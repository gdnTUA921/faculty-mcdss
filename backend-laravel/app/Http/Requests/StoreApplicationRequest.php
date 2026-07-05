<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['internal_applicant', 'external_applicant'], true);
    }

    public function rules(): array
    {
        return [
            'position_id' => ['required', 'uuid', 'exists:positions,id'],
        ];
    }
}
