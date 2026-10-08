<?php

// Router for PHP's local development server. Only public/ is served.
$public = realpath(__DIR__.'/../public');
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');
$file = realpath($public.$path);

if ($file !== false && str_starts_with($file, $public.DIRECTORY_SEPARATOR) && is_file($file)) {
    return false;
}

chdir($public);
require $public.'/index.php';
