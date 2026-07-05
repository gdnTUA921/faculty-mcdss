<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['internal_applicant', 'external_applicant'], true);
    }

    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'mimes:'.config('documents.allowed_mimes'),
                'max:'.config('documents.max_upload_kb'),
            ],
            'document_type' => ['required', 'string', 'max:100'],
            'application_id' => ['nullable', 'uuid', 'exists:applications,id'],
        ];
    }
}
