<?php

namespace App\Http\Requests;

use App\Models\Position;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePositionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }


    /**
     * status is deliberately absent: opening a position requires criteria weights
     * summing to 1.0, so that move belongs to PositionStatusController.
     *
     * department_id and target_applicant_type lock once real applications exist --
     * both decide who was eligible to apply and which director can see the results,
     * so changing them after the fact misrepresents applications already submitted.
     */
    public function rules(): array
    {
        return [
            'department_id' => ['sometimes', $this->lockedOnChange('department_id'), 'uuid', 'exists:departments,id'],
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string'],
            'target_applicant_type' => [
                'sometimes',
                $this->lockedOnChange('target_applicant_type'),
                Rule::in(['external', 'internal', 'both']),
            ],
            'slots_available' => ['sometimes', 'integer', 'min:1'],
            'slots_filled' => ['sometimes', 'integer', 'min:0'],
            'application_deadline' => ['sometimes', 'nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'department_id.prohibited' => 'The department cannot be changed once applicants have applied to this position.',
            'target_applicant_type.prohibited' => 'The target applicant type cannot be changed once applicants have applied to this position.',
        ];
    }

    /**
     * Rejects the field only when it would actually change, so an edit form that
     * resubmits every field untouched still saves the fields that are editable.
     */
    private function lockedOnChange(string $field): object
    {
        return Rule::prohibitedIf(function () use ($field) {
            $position = $this->route('position');

            if (! $position instanceof Position || $this->input($field) == $position->$field) {
                return false;
            }

            // Drafts have not been submitted yet, so they lock nothing down.
            return $position->applications()->where('status', '!=', 'draft')->exists();
        });
    }
}
