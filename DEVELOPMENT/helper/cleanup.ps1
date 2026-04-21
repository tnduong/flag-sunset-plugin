$ErrorActionPreference = 'Stop'

$scriptLabel = 'flag-sunset test reset (Windows)'
$codeAppSupport = Join-Path $env:APPDATA 'Code'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$candidateNovaRoots = @(
    (Join-Path (Split-Path -Parent $scriptDir) 'Applications\Nova'),
    (Join-Path (Split-Path -Parent $scriptDir) 'Nova')
)

$novaRoot = $null
foreach ($candidate in $candidateNovaRoots) {
    if (Test-Path $candidate) {
        $novaRoot = (Resolve-Path $candidate).Path
        break
    }
}

if (-not $novaRoot) {
    throw "${scriptLabel}: could not resolve the Nova workspace root from $scriptDir."
}

$workspaceLocalRootsFile = Join-Path $novaRoot '.copilot/flag-sunset/local-roots.json'
$localRootsFile = Join-Path $HOME '.copilot/flag-sunset/local-roots.json'

$standardPaths = @(
    $workspaceLocalRootsFile,
    $localRootsFile,
    (Join-Path $codeAppSupport 'Cache'),
    (Join-Path $codeAppSupport 'CachedData'),
    (Join-Path $codeAppSupport 'GPUCache')
)

$aggressivePaths = @(
    (Join-Path $codeAppSupport 'User/workspaceStorage'),
    (Join-Path $codeAppSupport 'User/globalStorage/github.copilot-chat')
)

$aggressive = $false

foreach ($arg in $args) {
    switch ($arg) {
        '--aggressive' {
            $aggressive = $true
        }
        '--help' {
            Write-Host 'Usage:'
            Write-Host '  pwsh -ExecutionPolicy Bypass -File .\cleanup.ps1 [--aggressive]'
            Write-Host ''
            Write-Host 'Behavior:'
            Write-Host '  - Removes the saved flag-sunset local-roots file.'
            Write-Host '  - Removes standard VS Code cache folders for Windows.'
            Write-Host '  - With --aggressive, also removes workspaceStorage and Copilot Chat global storage.'
            Write-Host ''
            Write-Host 'Requirement:'
            Write-Host '  - Quit VS Code before running this script.'
            exit 0
        }
        default {
            throw "Unknown argument: $arg"
        }
    }
}

$codeProcesses = Get-Process -Name 'Code' -ErrorAction SilentlyContinue
if ($codeProcesses) {
    throw "${scriptLabel}: quit VS Code before running this script."
}

Write-Host "Running $scriptLabel"
Write-Host 'Removing standard reset targets...'

foreach ($path in $standardPaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force
    }
    Write-Host "  removed $path"
}

if ($aggressive) {
    Write-Host 'Removing aggressive reset targets...'
    foreach ($path in $aggressivePaths) {
        if (Test-Path $path) {
            Remove-Item -Path $path -Recurse -Force
        }
        Write-Host "  removed $path"
    }
}

Write-Host ''
Write-Host 'Reset complete.'
Write-Host 'Next steps:'
Write-Host '  1. Reopen VS Code.'
Write-Host '  2. Run /flag-sunset YOUR_FLAG_KEY.'
Write-Host '  3. Confirm the workflow recreates Nova/.copilot/flag-sunset/local-roots.json without using the installed plugin directory.'
Write-Host '  4. Confirm the source-location prompt only appears when no usable config exists.'
