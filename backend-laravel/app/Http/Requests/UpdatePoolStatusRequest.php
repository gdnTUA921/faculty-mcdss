<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePoolStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Phase 10: directors are read-only, so pool mutation is admin-only.
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:inactive,expired'],
        ];
    }
}
