# FILE: C:\Users\soren\rewritelabs.io\discovery\run-all.ps1

Set-Location "C:\Users\soren\rewritelabs.io\discovery"

docker compose -f ".\docker\docker-compose.yml" up -d

$env:POSTGRES_URL = "postgres://postgres:postgres@localhost:5432/discovery"
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"

Start-Process powershell -ArgumentList "node .\orchestrator\index.js" -WindowStyle Minimized
Start-Process powershell -ArgumentList "node .\sweeper\index.js" -WindowStyle Minimized
Start-Process powershell -ArgumentList "node .\daemon\index.js" -WindowStyle Minimized
Start-Process powershell -ArgumentList "node .\matrix\index.js" -WindowStyle Minimized
Start-Process powershell -ArgumentList "node .\coordinator\index.js" -WindowStyle Minimized
Start-Process powershell -ArgumentList "node .\operator\index.js" -WindowStyle Minimized