#!/usr/bin/env pwsh
<#
.SYNOPSIS
RewriteLabs: Daily AI intelligence briefing dispatcher wrapper.

.DESCRIPTION
Validates and dispatches pending briefing-payload.json via dispatch-briefing.mjs
with full try/catch error handling and logging to C:\dev\logs\rewritelabs-briefing-dispatch.log.

.PARAMETER PayloadPath
Optional explicit path to briefing-payload.json. If omitted, probes staged payload paths.

.PARAMETER ArchiveDir
Optional directory of archived briefing payloads for backfill dispatch.

.PARAMETER ContentDir
Optional published briefings directory override.

.PARAMETER DryRun
Validate payloads without sending repository_dispatch to GitHub.
#>

[CmdletBinding()]
param(
    [string]$PayloadPath = '',
    [string]$ArchiveDir = '',
    [string]$ContentDir = '',
    [string]$LogDir = '',
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { 'C:\dev\rewritelabs-io\content-site\scripts' }
$ContentSiteRoot = Split-Path -Parent $ScriptDir
$RewriteRepoRoot = Split-Path -Parent $ContentSiteRoot
$DevRoot = Split-Path -Parent $RewriteRepoRoot
if (-not (Test-Path -LiteralPath (Join-Path $DevRoot 'logs'))) {
    $DevRoot = 'C:\dev'
}

if ([string]::IsNullOrWhiteSpace($LogDir)) {
    $LogDir = Join-Path $DevRoot 'logs'
}
$LogFile = Join-Path $LogDir 'rewritelabs-briefing-dispatch.log'
if (-not (Test-Path -LiteralPath $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('INFO', 'WARN', 'ERROR')][string]$Level = 'INFO'
    )
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$ts] [$Level] [RewriteLabs-Briefing-Dispatch] $Message"
    Write-Output $line
    Add-Content -LiteralPath $LogFile -Value $line -Encoding utf8
}

try {
    Write-Log "Starting RewriteLabs-Briefing-Dispatch (DryRun=$($DryRun.IsPresent))"

    $DispatchMjs = Join-Path $ScriptDir 'dispatch-briefing.mjs'
    if (-not (Test-Path -LiteralPath $DispatchMjs -PathType Leaf)) {
        throw "dispatch-briefing.mjs not found at: $DispatchMjs"
    }

    $NodeExe = (Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
    if (-not $NodeExe) { $NodeExe = 'node' }

    $resolvedPayload = $PayloadPath
    if ([string]::IsNullOrWhiteSpace($resolvedPayload)) {
        $candidates = @(
            'G:\My Drive\AI\briefing-payload.json',
            (Join-Path $ContentSiteRoot 'data\briefing-payload.json')
        )
        foreach ($cand in $candidates) {
            try {
                if (Test-Path -LiteralPath $cand -PathType Leaf) {
                    $resolvedPayload = $cand
                    break
                }
            } catch {
                Write-Log "Probe skipped for ${cand}: $($_.Exception.Message)" -Level 'WARN'
            }
        }
    } elseif (-not (Test-Path -LiteralPath $resolvedPayload -PathType Leaf)) {
        throw "Specified PayloadPath does not exist: $resolvedPayload"
    }

    if ([string]::IsNullOrWhiteSpace($resolvedPayload)) {
        Write-Log 'No staged briefing-payload.json found in Drive or content-site/data; nothing to dispatch.'
        exit 0
    }

    $hasToken = -not [string]::IsNullOrWhiteSpace($env:GH_DISPATCH_TOKEN)
    if (-not $hasToken) {
        foreach ($scope in @('User', 'Machine')) {
            $val = [System.Environment]::GetEnvironmentVariable('GH_DISPATCH_TOKEN', $scope)
            if (-not [string]::IsNullOrWhiteSpace($val)) {
                $env:GH_DISPATCH_TOKEN = $val
                $hasToken = $true
                break
            }
        }
    }

    $useDryRun = $DryRun.IsPresent -or (-not $hasToken)
    if (-not $hasToken -and -not $DryRun.IsPresent) {
        Write-Log 'GH_DISPATCH_TOKEN is not configured; falling back to --dry-run validation.' -Level 'WARN'
    }

    $nodeArgs = @($DispatchMjs, $resolvedPayload)
    if ($useDryRun) { $nodeArgs += '--dry-run' }
    if (-not [string]::IsNullOrWhiteSpace($ArchiveDir)) { $nodeArgs += @('--archive-dir', $ArchiveDir) }
    if (-not [string]::IsNullOrWhiteSpace($ContentDir)) { $nodeArgs += @('--content-dir', $ContentDir) }

    Write-Log "Invoking dispatch-briefing.mjs for payload '$resolvedPayload' (dryRun=$useDryRun)"
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $out = & $NodeExe @nodeArgs 2>&1
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $prevEap

    foreach ($line in @($out)) {
        $text = [string]$line
        if (-not [string]::IsNullOrWhiteSpace($text)) {
            Add-Content -LiteralPath $LogFile -Value $text -Encoding utf8
        }
    }

    if ($exitCode -ne 0) {
        throw "dispatch-briefing.mjs failed with exit code $exitCode"
    }

    Write-Log 'RewriteLabs-Briefing-Dispatch completed cleanly.'
    exit 0
} catch {
    Write-Log "Unhandled error: $($_.Exception.Message)" -Level 'ERROR'
    if ($_.ScriptStackTrace) {
        Add-Content -LiteralPath $LogFile -Value $_.ScriptStackTrace -Encoding utf8
    }
    exit 1
}
