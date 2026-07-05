<?php

return [
    'max_upload_kb' => env('DOCUMENT_MAX_UPLOAD_KB', 5120),
    'allowed_mimes' => env('DOCUMENT_ALLOWED_MIMES', 'pdf,doc,docx,jpg,jpeg,png'),
];
