<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The Next.js frontend runs on a different origin (localhost:3000) from the
    | API (localhost:8000), so every browser call is cross-origin.
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    // Local development origins. Tighten this to the real frontend host before
    // deploying — '*' cannot be combined with credentialed requests.
    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    /*
     * Without this the browser hides Content-Disposition from JavaScript, and the
     * CSV export and document downloads lose their server-provided filenames.
     */
    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 0,

    // Auth uses Sanctum bearer tokens, not cookies, so credentials stay off.
    'supports_credentials' => false,

];
