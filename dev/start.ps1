param([string]$Php)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $Php) {
    $portablePhp = Join-Path (Split-Path -Parent $repoRoot) '.runtime\php\php.exe'
    if (Test-Path -LiteralPath $portablePhp) { $Php = $portablePhp }
    else { $Php = (Get-Command php -ErrorAction Stop).Source }
}
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'config.php'))) {
    throw 'Run the installation steps in DEV-DEMO.md first.'
}
Push-Location $repoRoot
try {
    Write-Host 'Flarum demo: http://127.0.0.1:8888'
    & $Php -S '127.0.0.1:8888' -t public dev/router.php
} finally { Pop-Location }
