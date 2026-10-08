<?php

// Generate local-only install configuration; never overwrite an installed forum.
$root = dirname(__DIR__);
if (file_exists($root.'/config.php')) {
    fwrite(STDERR, "This forum is already installed. No data changed.\n");
    exit(1);
}

$credentialsPath = $root.'/.demo-credentials.json';
$credentials = file_exists($credentialsPath)
    ? json_decode(file_get_contents($credentialsPath), true, flags: JSON_THROW_ON_ERROR)
    : ['username' => 'admin', 'password' => 'Demo!'.bin2hex(random_bytes(6)), 'email' => 'admin@demo.invalid'];
file_put_contents($credentialsPath, json_encode($credentials, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

// Pre-create the file so the installer accepts an absolute SQLite path on Windows.
$database = $root.'/storage/demo.sqlite';
if (!file_exists($database) && !touch($database)) {
    throw new RuntimeException('Cannot create the demo SQLite database.');
}

$config = [
    'debug' => true,
    'baseUrl' => 'http://127.0.0.1:8888',
    'databaseConfiguration' => [
        'driver' => 'sqlite',
        'database' => $database,
        'prefix' => '',
    ],
    'adminUser' => $credentials,
    'settings' => [
        'forum_title' => 'ProjectSay',
        'forum_description' => '一个轻巧的交流空间。分享想法，提出问题，一起讨论。',
        'welcome_title' => '欢迎来到 ProjectSay',
        'welcome_message' => '从一个问题开始，让讨论自然发生。',
        'theme_primary_color' => '#5268ca',
        'theme_secondary_color' => '#f1f3fa',
        'mail_driver' => 'log',
        'mail_from' => 'forum@demo.invalid',
        'mail_from_name' => 'ProjectSay Demo',
    ],
];
file_put_contents($root.'/.demo-install.json', json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
echo "Local install configuration prepared.\n";
