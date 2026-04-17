$ErrorActionPreference = 'Stop'

$queries = @(
    'WFD_5383_Add_WFD_RECRUITER',
    'WFD_5433_TR_LIVE_LIST_ADD_WFD_RECRUITER',
    'wfd-5455-atm-add-wfd-recruiter',
    'WFD_5383_ADD_WFD_RECRUITER_TO_TEAM_INFO',
    'WFD_FAKE_NOT_REAL'
)

# applications.md derived scopes
$scopes = @(
    @{ Root = 'C:\src\Applications\Nova\src\app'; Exts = @('ts', 'html') },
    @{ Root = 'C:\src\Applications\Aya.Core.Api'; Exts = @('cs') },
    @{ Root = 'C:\src\aya-talent-marketplace\apps\atm-web'; Exts = @('ts', 'html') },
    @{ Root = 'C:\src\aya-talent-marketplace\libs'; Exts = @('ts', 'html') },
    @{ Root = 'C:\src\Applications\QaAutomation\cypress\e2e'; Exts = @('feature') }
)

function Get-RgMatches {
    param([string] $Query)

    $all = @()

    foreach ($scope in $scopes) {
        if (-not (Test-Path $scope.Root)) {
            continue
        }

        $args = @('-n', '--fixed-strings')
        foreach ($ext in $scope.Exts) {
            $args += @('--glob', "*.$ext")
        }
        $args += @($Query, $scope.Root)

        $result = & rg @args 2>$null
        if ($LASTEXITCODE -eq 0 -and $result) {
            $all += $result | ForEach-Object {
                $parts = $_ -split ':', 3
                if ($parts.Length -ge 2) {
                    "$($parts[0]):$($parts[1])"
                }
            }
        }
    }

    if (-not $all) {
        return @()
    }

    return @($all | Sort-Object -Unique)
}

function Get-SelectStringMatches {
    param([string] $Query)

    $files = @()

    foreach ($scope in $scopes) {
        if (-not (Test-Path $scope.Root)) {
            continue
        }

        foreach ($ext in $scope.Exts) {
            $files += Get-ChildItem -Path $scope.Root -Recurse -File -Filter "*.$ext" -ErrorAction SilentlyContinue |
                ForEach-Object { $_.FullName }
        }
    }

    if (-not $files) {
        return @()
    }

    $matches = Select-String -Path $files -Pattern $Query -CaseSensitive -ErrorAction SilentlyContinue
    if (-not $matches) {
        return @()
    }

    return @($matches | ForEach-Object { "{0}:{1}" -f $_.Path, $_.LineNumber } | Sort-Object -Unique)
}

$summary = @()

foreach ($query in $queries) {
    $rgMatches = @(Get-RgMatches -Query $query)
    $ssMatches = @(Get-SelectStringMatches -Query $query)

    if ($null -eq $rgMatches) {
        $rgMatches = @()
    }
    if ($null -eq $ssMatches) {
        $ssMatches = @()
    }

    $onlyRg = Compare-Object -ReferenceObject $rgMatches -DifferenceObject $ssMatches -PassThru | Where-Object { $_ -in $rgMatches }
    $onlySs = Compare-Object -ReferenceObject $rgMatches -DifferenceObject $ssMatches -PassThru | Where-Object { $_ -in $ssMatches }

    $summary += [pscustomobject]@{
        Query               = $query
        RgCount             = $rgMatches.Count
        SelectStringCount   = $ssMatches.Count
        OnlyRgCount         = $onlyRg.Count
        OnlySelectStringCount = $onlySs.Count
    }

    Write-Output "=== $query ==="
    Write-Output "RG=$($rgMatches.Count) SELECTSTRING=$($ssMatches.Count) ONLY_RG=$($onlyRg.Count) ONLY_SS=$($onlySs.Count)"

    if ($onlyRg.Count -gt 0) {
        Write-Output '-- only in rg --'
        $onlyRg | Select-Object -First 10
    }

    if ($onlySs.Count -gt 0) {
        Write-Output '-- only in Select-String --'
        $onlySs | Select-Object -First 10
    }
}

Write-Output '=== SUMMARY ==='
$summary | Format-Table -AutoSize
