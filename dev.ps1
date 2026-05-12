# QALGO — Start API + Frontend Dev Server
# Usage: .\dev.ps1

$ErrorActionPreference = "Continue"
$root = $PSScriptRoot

Write-Host ""
Write-Host "  QALGO Dev Launcher" -ForegroundColor Cyan
Write-Host "  ==================" -ForegroundColor DarkGray
Write-Host ""

# --- Start API ---
Write-Host "[API] Starting backend on port 3001..." -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
    Set-Location $using:root
    npx -y pnpm@11 --filter @qalgo/api dev
}
Start-Sleep -Seconds 2

# --- Start Frontend ---
Write-Host "[APP] Starting Vite dev server on port 5173..." -ForegroundColor Yellow
$appJob = Start-Job -ScriptBlock {
    Set-Location $using:root
    npx -y pnpm@11 --filter @qalgo/app dev
}

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "  Ready!" -ForegroundColor Green
Write-Host "  API:  http://localhost:3001" -ForegroundColor DarkGray
Write-Host "  App:  http://localhost:5173" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Press Ctrl+C to stop all servers" -ForegroundColor DarkGray
Write-Host ""

# --- Keep alive and stream output ---
try {
    while ($true) {
        @($apiJob, $appJob) | ForEach-Object {
            Receive-Job -Job $_ -ErrorAction SilentlyContinue | ForEach-Object {
                Write-Host $_
            }
        }
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host ""
    Write-Host "Shutting down..." -ForegroundColor Red
    @($apiJob, $appJob) | ForEach-Object {
        Stop-Job -Job $_ -ErrorAction SilentlyContinue
        Remove-Job -Job $_ -Force -ErrorAction SilentlyContinue
    }
    # Kill any lingering processes on the ports
    @(3001, 5173) | ForEach-Object {
        $port = $_
        Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "Done." -ForegroundColor Green
}
