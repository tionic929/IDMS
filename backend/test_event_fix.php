<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';

use App\Events\ApplicationSubmitted;

$data = (object)[
    'id' => 1,
    'id_number' => '20230001',
    'first_name' => 'JOHN',
    'last_name' => 'DOE',
    'full_name' => 'JOHN DOE'
];

try {
    $event = new ApplicationSubmitted($data);
    echo "SUCCESS: Event instantiated successfully with stdClass.\n";
    echo "Student Data: " . json_encode($event->student) . "\n";
} catch (\Throwable $e) {
    echo "FAILURE: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
