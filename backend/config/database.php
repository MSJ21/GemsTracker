<?php
return [
    'host'     => $_ENV['DB_HOST'] ?? '13.203.36.86',
    'port'     => $_ENV['DB_PORT'] ?? '5432',
    'dbname'   => $_ENV['DB_NAME'] ?? 'project_tracker',
    'user'     => $_ENV['DB_USER'] ?? 'postgres',
    'password' => $_ENV['DB_PASS'] ?? 'Gemicates@2025',
];
