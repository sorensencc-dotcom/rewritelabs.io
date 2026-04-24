param(
    [switch]$Install
)

Write-Host "`n=== Dev Launcher: rewrite-mcp ===`n"

if ($Install) {
    Write-Host "Running npm install..."
    npm install
}

Write-Host "Starting dev server (npm run dev)..."
npm run dev
