param(
    [string]$Flag = 'WFD_5383_Add_WFD_RECRUITER'
)

$ErrorActionPreference = 'Stop'

$scopes = @(
    @{ Root = 'C:\src\Applications\Nova\src\app'; Exts = @('ts', 'html') },
    @{ Root = 'C:\src\Applications\Aya.Core.Api'; Exts = @('cs') },
    @{ Root = 'C:\src\aya-talent-marketplace\apps\atm-web'; Exts = @('ts', 'html') },
    @{ Root = 'C:\src\aya-talent-marketplace\libs'; Exts = @('ts', 'html') },
    @{ Root = 'C:\src\Applications\QaAutomation\cypress\e2e'; Exts = @('feature') }
)

function Get-RgRaw {
    param([string]$Query)
    $all = @()
    foreach ($scope in $scopes) {
        if (-not (Test-Path $scope.Root)) { continue }
        $args = @('-n', '--fixed-strings')
        foreach ($ext in $scope.Exts) { $args += @('--glob', "*.$ext") }
        $args += @($Query, $scope.Root)
        $result = & rg @args 2>$null
        if ($LASTEXITCODE -eq 0 -and $result) { $all += $result }
    }
    return @($all)
}

function Get-SelectRaw {
    param([string]$Query)
    $files = @()
    foreach ($scope in $scopes) {
        if (-not (Test-Path $scope.Root)) { continue }
        foreach ($ext in $scope.Exts) {
            $files += Get-ChildItem -Path $scope.Root -Recurse -File -Filter "*.$ext" -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName }
        }
    }
    if (-not $files) { return @() }
    $matches = Select-String -Path $files -Pattern $Query -CaseSensitive -ErrorAction SilentlyContinue
    return @($matches)
}

$rgRaw = @(Get-RgRaw -Query $Flag)
$ssRaw = @(Get-SelectRaw -Query $Flag)

$rgFileLine = @($rgRaw | ForEach-Object {
    if ($_ -match '^(?<path>.+):(?<line>\d+):') {
        "{0}:{1}" -f $matches.path, $matches.line
    }
} | Sort-Object -Unique)

$ssFileLine = @($ssRaw | ForEach-Object { "{0}:{1}" -f $_.Path, $_.LineNumber } | Sort-Object -Unique)

$rgFiles = @($rgFileLine | ForEach-Object {
    $_.Substring(0, $_.LastIndexOf(':'))
} | Sort-Object -Unique)

$ssFiles = @($ssFileLine | ForEach-Object {
    $_.Substring(0, $_.LastIndexOf(':'))
} | Sort-Object -Unique)

$onlyRgFileLine = @(Compare-Object -ReferenceObject $rgFileLine -DifferenceObject $ssFileLine -PassThru | Where-Object { $_ -in $rgFileLine })
$onlySsFileLine = @(Compare-Object -ReferenceObject $rgFileLine -DifferenceObject $ssFileLine -PassThru | Where-Object { $_ -in $ssFileLine })
$onlyRgFiles = @(Compare-Object -ReferenceObject $rgFiles -DifferenceObject $ssFiles -PassThru | Where-Object { $_ -in $rgFiles })
$onlySsFiles = @(Compare-Object -ReferenceObject $rgFiles -DifferenceObject $ssFiles -PassThru | Where-Object { $_ -in $ssFiles })

Write-Output "FLAG=$Flag"
Write-Output "RG_FILELINE_COUNT=$($rgFileLine.Count)"
Write-Output "SS_FILELINE_COUNT=$($ssFileLine.Count)"
Write-Output "RG_FILE_COUNT=$($rgFiles.Count)"
Write-Output "SS_FILE_COUNT=$($ssFiles.Count)"
Write-Output "ONLY_RG_FILELINE=$($onlyRgFileLine.Count)"
Write-Output "ONLY_SS_FILELINE=$($onlySsFileLine.Count)"
Write-Output "ONLY_RG_FILES=$($onlyRgFiles.Count)"
Write-Output "ONLY_SS_FILES=$($onlySsFiles.Count)"

Write-Output "=== FILE SET (RG) ==="
$rgFiles
Write-Output "=== FILE SET (SS) ==="
$ssFiles

if ($onlyRgFiles.Count -gt 0) {
    Write-Output "=== FILES ONLY IN RG ==="
    $onlyRgFiles
}
if ($onlySsFiles.Count -gt 0) {
    Write-Output "=== FILES ONLY IN SS ==="
    $onlySsFiles
}
