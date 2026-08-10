<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssignmentRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Phase 10: directors are read-only, so triggering a solver run is admin-only.
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'hiring_round_id' => ['required', 'uuid', 'exists:hiring_rounds,id'],
            'scope_applicant_type' => ['required', Rule::in(['external', 'internal', 'both'])],
            'scope_position_ids' => ['nullable', 'array'],
            'scope_position_ids.*' => ['uuid', 'exists:positions,id'],
            'scope_department_ids' => ['nullable', 'array'],
            'scope_department_ids.*' => ['uuid', 'exists:departments,id'],
        ];
    }
}