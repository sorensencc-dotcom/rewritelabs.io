Write-Host "=== PROJECT INTEGRITY VALIDATOR ==="

# Fail fast
$ErrorActionPreference = "Stop"

function Assert($cond, $msg) {
    if (-not $cond) {
        Write-Host "FAIL: $msg" -ForegroundColor Red
        exit 1
    }
}

# 1) Root package.json exists
Assert (Test-Path "package.json") "package.json missing"

# 2) package.json is valid JSON
try {
    $pkg = Get-Content package.json -Raw | ConvertFrom-Json
} catch {
    Write-Host "FAIL: package.json is invalid JSON" -ForegroundColor Red
    exit 1
}
Write-Host "OK: package.json valid"

# 3) Ensure NOT ESM
Assert ($pkg.PSObject.Properties.Name -notcontains "type") "package.json contains 'type', must be CommonJS"

Write-Host "OK: CommonJS mode"

# 4) Directory structure
$dirs = @(
    "engine",
    "engine\osm"
)

foreach ($d in $dirs) {
    Assert (Test-Path $d) "Missing directory: $d"
}
Write-Host "OK: directory structure"

# 5) Required files
$files = @(
    "engine\osm\config.js",
    "engine\osm\metrics.js",
    "engine\osm\cache.js",
    "engine\osm\query.js",
    "engine\osm\http.js",
    "engine\osm\transform.js",
    "engine\osm\enumerator.js",
    "engine\osm\index.js"
)

foreach ($f in $files) {
    Assert (Test-Path $f) "Missing file: $f"
}
Write-Host "OK: all OSM files exist"

# 6) Require resolution test
Write-Host "Testing require('./engine/osm')..."
try {
    node -e "require('./engine/osm')" | Out-Null
} catch {
    Write-Host "FAIL: Node cannot require('./engine/osm')" -ForegroundColor Red
    exit 1
}
Write-Host "OK: require('./engine/osm') works"

# 7) Enumerator smoke test
Write-Host "Running enumerator smoke test..."
try {
    $out = node -e "require('./engine/osm').enumerateOSM('33602','plumber').then(r=>console.log(JSON.stringify(r)))"
} catch {
    Write-Host "FAIL: enumerator threw an exception" -ForegroundColor Red
    exit 1
}

Write-Host "OK: enumerator executed"

# 8) Validate output shape
try {
    $json = $out | ConvertFrom-Json
} catch {
    Write-Host "FAIL: enumerator output is not valid JSON" -ForegroundColor Red
    exit 1
}

Assert ($json.module -eq "OSM") "Enumerator output missing module='OSM'"
Assert ($json.zip -eq "33602") "Enumerator output missing zip"
Assert ($json.category -eq "plumber") "Enumerator output missing category"
Assert ($json.ms -ge 0) "Enumerator output missing ms"
Assert ($json.items -is [System.Collections.IEnumerable]) "Enumerator output missing items array"

Write-Host "OK: enumerator output structure valid"

Write-Host "=== ALL CHECKS PASSED ===" -ForegroundColor Green
exit 0