# Kill all running services by port
# Usage: powershell -ExecutionPolicy Bypass -File .\stop.ps1

$ports = @(3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 4000)

Write-Host "Stopping services..." -ForegroundColor Cyan

foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            $procId = $connections.OwningProcess | Select-Object -First 1
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            Write-Host "  Killing port $port (PID $procId - $($proc.ProcessName))" -ForegroundColor Red
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    } catch {
        # port not in use, skip
    }
}

Write-Host "Done." -ForegroundColor Yellow
