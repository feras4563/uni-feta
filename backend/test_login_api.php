<?php

$url = 'http://127.0.0.1:8000/api/auth/login';

$data = [
    'email' => 'manager@university.edu',
    'password' => 'password123'
];

$options = [
    'http' => [
        'header'  => "Content-Type: application/json\r\n" .
                     "Accept: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true
    ]
];

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);

echo "=== API Login Test ===\n\n";
echo "URL: $url\n";
echo "Email: {$data['email']}\n";
echo "Password: {$data['password']}\n\n";

echo "Response Headers:\n";
print_r($http_response_header);

echo "\nResponse Body:\n";
echo $result;
echo "\n";

// Try to decode JSON
$json = json_decode($result, true);
if ($json) {
    echo "\nDecoded JSON:\n";
    print_r($json);
}
