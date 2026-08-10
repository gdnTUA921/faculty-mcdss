<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreHiringRoundRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:200'],
            'semester'      => ['required', 'string', 'max:50'],
            'academic_year' => ['required', 'integer', 'min:2000'],
            'start_date'    => ['required', 'date'],
            'end_date'      => ['required', 'date', 'after_or_equal:start_date'],
            'status'        => ['sometimes', 'in:active,closed,archived'],
        ];
    }
}
