param(
    [string[]]$Flags = @(
        'WFD-5487-display-strike-duplication',
        'WFD-5473-job-capacity-metric',
        'WFD_5395_Open_Position_Bug',
        'WFD_5383_Add_WFD_RECRUITER'
    )
)

$ErrorActionPreference = 'Stop'

$appConfigs = @(
    @{
        Name = 'Nova'
        DefFile = 'C:\src\Applications\Nova\src\app\shared\models\enums\feature-flag.ts'
        SearchRoots = @('C:\src\Applications\Nova\src\app')
        Exts = @('ts', 'html')
        DefType = 'ts'
    },
    @{
        Name = 'CoreApi'
        DefFile = 'C:\src\Applications\Aya.Core.Api\Aya.Core.Common\FeatureManagement\FeatureFlag.cs'
        SearchRoots = @('C:\src\Applications\Aya.Core.Api')
        Exts = @('cs')
        DefType = 'cs'
    },
    @{
        Name = 'aya-talent-marketplace'
        DefFile = 'C:\src\aya-talent-marketplace\apps\atm-web\src\app\shared\enums\feature-flag.ts'
        SearchRoots = @('C:\src\aya-talent-marketplace\apps\atm-web', 'C:\src\aya-talent-marketplace\libs')
        Exts = @('ts', 'html')
        DefType = 'ts'
    }
)

function Get-RgFileLine {
    param([string]$Query, [string[]]$Roots, [string[]]$Exts)

    $all = @()
    foreach ($root in $Roots) {
        if (-not (Test-Path $root)) { continue }
        $args = @('-n', '--fixed-strings')
        foreach ($ext in $Exts) {
            $args += @('--glob', "*.$ext")
        }
        $args += @($Query, $root)
        $result = & rg @args 2>$null
        if ($LASTEXITCODE -eq 0 -and $result) {
            $all += $result | ForEach-Object {
                if ($_ -match '^(?<path>.+):(?<line>\d+):') {
                    "{0}:{1}" -f $matches.path, $matches.line
                }
            }
        }
    }

    if (-not $all) { return @() }
    return @($all | Sort-Object -Unique)
}

function Get-SSFileLine {
    param([string]$Query, [string[]]$Roots, [string[]]$Exts)

    $files = @()
    foreach ($root in $Roots) {
        if (-not (Test-Path $root)) { continue }
        foreach ($ext in $Exts) {
            $files += Get-ChildItem -Path $root -Recurse -File -Filter "*.$ext" -ErrorAction SilentlyContinue |
                ForEach-Object { $_.FullName }
        }
    }

    if (-not $files) { return @() }

    $matches = Select-String -Path $files -Pattern $Query -CaseSensitive -ErrorAction SilentlyContinue
    if (-not $matches) { return @() }

    return @($matches | ForEach-Object { "{0}:{1}" -f $_.Path, $_.LineNumber } | Sort-Object -Unique)
}

function Get-FilesFromFileLine {
    param([string[]]$FileLines)
    if (-not $FileLines) { return @() }
    return @($FileLines | ForEach-Object { $_.Substring(0, $_.LastIndexOf(':')) } | Sort-Object -Unique)
}

function Extract-Identifiers {
    param([string]$DefFile, [string]$RawKey, [string]$DefType)

    if (-not (Test-Path $DefFile)) { return @() }

    $lines = Select-String -Path $DefFile -Pattern ([regex]::Escape($RawKey)) -CaseSensitive -SimpleMatch
    if (-not $lines) { return @() }

    $ids = @()
    foreach ($m in $lines) {
        $line = $m.Line
        if ($DefType -eq 'ts') {
            if ($line -match '^\s*([A-Za-z0-9_]+)\s*=\s*[''\"]') {
                $ids += $matches[1]
            }
        }
        elseif ($DefType -eq 'cs') {
            if ($line -match "^\s*public\s+const\s+string\s+([A-Za-z0-9_]+)\s*=") {
                $ids += $matches[1]
            }
        }
    }

    return @($ids | Sort-Object -Unique)
}

foreach ($flag in $Flags) {
    Write-Output "========== FLAG: $flag =========="

    foreach ($app in $appConfigs) {
        $ids = @(Extract-Identifiers -DefFile $app.DefFile -RawKey $flag -DefType $app.DefType)
        if (-not $ids -or $ids.Count -eq 0) {
            Write-Output "[$($app.Name)] NO_MATCH_IN_DEFINITION"
            continue
        }

        Write-Output "[$($app.Name)] IDENTIFIERS=$($ids -join ',')"

        $rawRgFileLine = @(Get-RgFileLine -Query $flag -Roots $app.SearchRoots -Exts $app.Exts)
        $rawFiles = @(Get-FilesFromFileLine -FileLines $rawRgFileLine)

        $idRgAll = @()
        $idSsAll = @()
        foreach ($id in $ids) {
            $idRgAll += Get-RgFileLine -Query $id -Roots $app.SearchRoots -Exts $app.Exts
            $idSsAll += Get-SSFileLine -Query $id -Roots $app.SearchRoots -Exts $app.Exts
        }

        $idRgFileLine = @($idRgAll | Sort-Object -Unique)
        $idSsFileLine = @($idSsAll | Sort-Object -Unique)

        $idRgFiles = @(Get-FilesFromFileLine -FileLines $idRgFileLine)
        $idSsFiles = @(Get-FilesFromFileLine -FileLines $idSsFileLine)

        $missedByRaw = @(Compare-Object -ReferenceObject $rawFiles -DifferenceObject $idRgFiles -PassThru |
            Where-Object { $_ -in $idRgFiles })

        $engineRgOnly = @(Compare-Object -ReferenceObject $idRgFileLine -DifferenceObject $idSsFileLine -PassThru |
            Where-Object { $_ -in $idRgFileLine })

        $engineSsOnly = @(Compare-Object -ReferenceObject $idRgFileLine -DifferenceObject $idSsFileLine -PassThru |
            Where-Object { $_ -in $idSsFileLine })

        Write-Output "[$($app.Name)] RAW_FILE_COUNT=$($rawFiles.Count) ID_FILE_COUNT=$($idRgFiles.Count) MISSED_BY_RAW=$($missedByRaw.Count)"
        if ($missedByRaw.Count -gt 0) {
            Write-Output "[$($app.Name)] FILES_MISSED_BY_RAW:"
            $missedByRaw | Select-Object -First 20 | ForEach-Object { "  $_" }
        }

        Write-Output "[$($app.Name)] ENGINE_DIFF_ID_FILELINE RG_ONLY=$($engineRgOnly.Count) SS_ONLY=$($engineSsOnly.Count)"
        if ($engineRgOnly.Count -gt 0) {
            Write-Output "[$($app.Name)] ENGINE_RG_ONLY_SAMPLE:"
            $engineRgOnly | Select-Object -First 10 | ForEach-Object { "  $_" }
        }
        if ($engineSsOnly.Count -gt 0) {
            Write-Output "[$($app.Name)] ENGINE_SS_ONLY_SAMPLE:"
            $engineSsOnly | Select-Object -First 10 | ForEach-Object { "  $_" }
        }
    }
}
