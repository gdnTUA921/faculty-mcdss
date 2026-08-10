<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHiringRoundRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * status is deliberately absent: lifecycle moves carry side effects (closing
     * migrates unhired applicants into the pool and emails them), so they belong
     * to the dedicated close/archive endpoints rather than a general edit.
     */
    public function rules(): array
    {
        return [
            'name'          => ['sometimes', 'string', 'max:200'],
            'semester'      => ['sometimes', 'string', 'max:50'],
            'academic_year' => ['sometimes', 'integer', 'min:2000'],
            'start_date'    => ['sometimes', 'date'],
            'end_date'      => ['sometimes', 'date', 'after_or_equal:start_date'],
        ];
    }

    /**
     * end_date is validated against start_date — fall back to the stored value
     * when the request only sends one of the two dates.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('end_date') && ! $this->has('start_date')) {
            $this->merge(['start_date' => $this->route('hiringRound')?->start_date?->toDateString()]);
        }
    }
}
