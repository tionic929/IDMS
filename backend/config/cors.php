<?php

$allowedOrigins = array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', ''))));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth', 'storage/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins ?: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://192.168.68.106:5173',
        'http://10.74.218.253:5173',
        'http://192.168.68.62:5173',
        'http://192.168.68.61:5173',
        'http://192.168.68.106:5173',
        'http://10.0.31.10:5173',
        'http://192.168.68.64:5173',
        'https://ncnian-id.svizcarra.online',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
