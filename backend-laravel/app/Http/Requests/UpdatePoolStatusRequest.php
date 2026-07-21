<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePoolStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user && in_array($user->role, ['admin', 'director'], true);
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:inactive,expired'],
        ];
    }
}
