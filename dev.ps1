# Start all services in separate windows
# Usage: powershell -ExecutionPolicy Bypass -File .\dev.ps1

$services = @(
    @{ name = "api-gateway";          workspace = "services/api-gateway" },
    @{ name = "auth-service";         workspace = "services/auth-service" },
    @{ name = "task-service";         workspace = "services/task-service" },
    @{ name = "notification-service"; workspace = "services/notification-service" },
    @{ name = "ai-service";           workspace = "services/ai-service" },
    @{ name = "search-service";       workspace = "services/search-service" },
    @{ name = "analytics-service";    workspace = "services/analytics-service" },
    @{ name = "frontend";             workspace = "frontend" }
)

$ports = @(3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 4000)
$root = $PSScriptRoot

# --- Stop existing processes ---
Write-Host "Stopping any existing services..." -ForegroundColor Cyan
foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            $procId = $connections.OwningProcess | Select-Object -First 1
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            Write-Host "  Killing port $port (PID $procId - $($proc.ProcessName))" -ForegroundColor Red
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    } catch { }
}
Write-Host ""

# --- Infrastructure ---
Write-Host "Starting infrastructure..." -ForegroundColor Cyan
docker compose up -d
Write-Host ""

# --- Shared package ---
Write-Host "Building shared package..." -ForegroundColor Cyan
npm run build --workspace=packages/shared
Write-Host ""

# --- Services ---
foreach ($svc in $services) {
    Write-Host "Starting $($svc.name)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd '$root'; npm run dev --workspace=$($svc.workspace)"
}

Write-Host ""
Write-Host "All services started!" -ForegroundColor Yellow
Write-Host "  api-gateway:          http://localhost:3000"
Write-Host "  auth-service:         http://localhost:3002"
Write-Host "  task-service:         http://localhost:3001"
Write-Host "  notification-service: http://localhost:3003"
Write-Host "  ai-service:           http://localhost:3004"
Write-Host "  search-service:       http://localhost:3005"
Write-Host "  analytics-service:    http://localhost:3006"
Write-Host "  frontend:             http://localhost:4000"
Write-Host "  mailhog UI:           http://localhost:8025"
Write-Host "  grafana:              http://localhost:3100"
