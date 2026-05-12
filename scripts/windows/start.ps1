# QALGO — Start Backend + Desktop App
# Usage: .\start.ps1

$ErrorActionPreference = "Continue"
$root = $PSScriptRoot

Write-Host ""
Write-Host "  QALGO Desktop Launcher" -ForegroundColor Cyan
Write-Host "  =======================" -ForegroundColor DarkGray
Write-Host ""

# --- Start API server as a hidden background process ---
Write-Host "[1/2] Starting API server (port 3001)..." -ForegroundColor Yellow

# Use tsx directly to avoid npx prompt issues
$tsxPath = Join-Path $root "packages\api\node_modules\.bin\tsx.CMD"
$apiEntry = Join-Path $root "packages\api\src\index.ts"

$apiProcess = Start-Process -FilePath $tsxPath -ArgumentList "watch",$apiEntry -WorkingDirectory (Join-Path $root "packages\api") -PassThru -WindowStyle Hidden -RedirectStandardOutput "$root\.api-out.log" -RedirectStandardError "$root\.api-err.log"

# Wait for API to be ready
Write-Host "       Waiting for API..." -ForegroundColor DarkGray
$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", 3001)
        $tcp.Close()
        $ready = $true
        break
    } catch {}
}

if ($ready) {
    Write-Host "[API] Backend ready on http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "[API] Still starting, continuing anyway..." -ForegroundColor DarkYellow
    if (Test-Path "$root\.api-err.log") {
        Get-Content "$root\.api-err.log" -ErrorAction SilentlyContinue | Select-Object -First 5 | Write-Host -ForegroundColor DarkRed
    }
}

# --- Launch Tauri desktop app (starts Vite + native window) ---
Write-Host "[2/2] Launching desktop app..." -ForegroundColor Yellow
Write-Host ""

try {
    Set-Location $root
    & npx -y pnpm@11 --filter @qalgo/app tauri:dev
}
finally {
    Write-Host ""
    Write-Host "Shutting down..." -ForegroundColor Red

    # Stop API process
    if ($apiProcess -and !$apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
        # Also kill child processes (node)
        Get-CimInstance Win32_Process -Filter "ParentProcessId=$($apiProcess.Id)" -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        }
    }

    # Kill lingering processes on dev ports
    @(3001, 5173) | ForEach-Object {
        Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }

    # Clean up log files
    Remove-Item "$root\.api-out.log" -ErrorAction SilentlyContinue
    Remove-Item "$root\.api-err.log" -ErrorAction SilentlyContinue

    Write-Host "Done." -ForegroundColor Green
}
