$script:QueueStatePath = Join-Path $PSScriptRoot "queue-state.json"
$script:Queue = @{}

function Initialize-Queue {
    if (Test-Path $script:QueueStatePath) {
        try {
            $raw = Get-Content $script:QueueStatePath -Raw
            if ($raw.Trim()) {
                $script:Queue = ($raw | ConvertFrom-Json -Depth 10)
            }
        } catch {
            $script:Queue = @{}
        }
    } else {
        $script:Queue = @{}
    }
}

function Save-Queue {
    $json = $script:Queue | ConvertTo-Json -Depth 10
    $json | Set-Content -Path $script:QueueStatePath -Encoding UTF8
}

function New-QueueJob {
    param(
        [string]$Region,
        [int]$ShardIndex = 0,
        [int]$ShardCount = 1,
        [int]$Total = 0,
        [string]$Type = "sweep"
    )

    $id = [guid]::NewGuid().ToString("N")
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

    $job = [pscustomobject]@{
        id          = $id
        type        = $Type
        region      = $Region
        shardIndex  = $ShardIndex
        shardCount  = $ShardCount
        status      = "queued"
        processed   = 0
        total       = $Total
        created     = $now
        updated     = $now
        meta        = @{}
    }

    $script:Queue[$id] = $job
    Save-Queue
    return $job
}

function Get-Queue {
    param([string]$Status)

    $jobs = $script:Queue.Values
    if ($Status) {
        $jobs = $jobs | Where-Object { $_.status -eq $Status }
    }
    return $jobs | Sort-Object created
}

function Get-QueueJob {
    param([Parameter(Mandatory)][string]$Id)
    if ($script:Queue.ContainsKey($Id)) { return $script:Queue[$Id] }
    return $null
}

function Set-QueueJobStatus {
    param(
        [Parameter(Mandatory)][string]$Id,
        [Parameter(Mandatory)][ValidateSet("queued","running","completed","failed","cancelled")][string]$Status
    )

    $job = Get-QueueJob -Id $Id
    if (-not $job) { return $null }

    $job.status = $Status
    $job.updated = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $script:Queue[$Id] = $job
    Save-Queue
    return $job
}

function Update-QueueJobProgress {
    param(
        [Parameter(Mandatory)][string]$Id,
        [int]$Processed,
        [int]$Total
    )

    $job = Get-QueueJob -Id $Id
    if (-not $job) { return $null }

    if ($PSBoundParameters.ContainsKey("Processed")) { $job.processed = $Processed }
    if ($PSBoundParameters.ContainsKey("Total")) { $job.total = $Total }

    $job.updated = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $script:Queue[$Id] = $job
    Save-Queue
    return $job
}

function Increment-QueueJobProcessed {
    param(
        [Parameter(Mandatory)][string]$Id,
        [int]$By = 1
    )

    $job = Get-QueueJob -Id $Id
    if (-not $job) { return $null }

    $job.processed += $By
    if ($job.processed -lt 0) { $job.processed = 0 }

    $job.updated = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $script:Queue[$Id] = $job
    Save-Queue
    return $job
}

function Remove-QueueJob {
    param([Parameter(Mandatory)][string]$Id)

    if ($script:Queue.ContainsKey($Id)) {
        $script:Queue.Remove($Id) | Out-Null
        Save-Queue
        return $true
    }
    return $false
}

function Clear-Queue {
    $script:Queue.Clear()
    Save-Queue
}

function Get-QueueSummary {
    $jobs = $script:Queue.Values
    $total = $jobs.Count

    $byStatus = $jobs | Group-Object status | ForEach-Object {
        [pscustomobject]@{
            status = $_.Name
            count  = $_.Count
        }
    }

    [pscustomobject]@{
        total    = $total
        byStatus = $byStatus
    }
}

Export-ModuleMember -Function *-Queue*
Initialize-Queue