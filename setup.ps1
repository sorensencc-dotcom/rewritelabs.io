# File: setup.ps1

$root = Get-Location

$dirs = @(
  "engine",
  "data",
  "data\queue",
  "data\results",
  "data\feeds"
)

foreach ($d in $dirs) {
  New-Item -ItemType Directory -Force -Path (Join-Path $root $d) | Out-Null
}

$files = @(
  "engine\ingest.js",
  "engine\fingerprint.js",
  "engine\classify.js",
  "engine\parallel.js",
  "engine\updateFeeds.js",
  "run.js",
  "data\feeds\domains.txt",
  "data\feeds\wordpress.txt",
  "data\feeds\outdated.txt",
  "data\feeds\fingerprints.jsonl"
)

foreach ($f in $files) {
  New-Item -ItemType File -Force -Path (Join-Path $root $f) | Out-Null
}

# sample queue item
$sample = @{
  url  = "http://example.com"
  html = "<html><head><title>Example</title></head><body><h1>Example</h1></body></html>"
} | ConvertTo-Json -Depth 5

$samplePath = Join-Path $root "data\queue\001.json"
$sample | Out-File -FilePath $samplePath -Encoding UTF8

Write-Host "Project structure created."