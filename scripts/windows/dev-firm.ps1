# BBSIM — Start Firm (Broker) Desktop App
# Starts: API server + Vite frontend + Zig native shell
# Usage: .\scripts\dev-firm.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Starting BBSIM Firm (Broker Side)..." -ForegroundColor Cyan
Write-Host ""

# Start API server in background
Write-Host "[1/3] Starting API server (port 3001)..." -ForegroundColor Yellow
$api = Start-Process -FilePath "pnpm" -ArgumentList "--filter @bbsim/api dev" -WorkingDirectory $root -PassThru -NoNewWindow
Start-Sleep -Seconds 2

# Start Vite frontend in background
Write-Host "[2/3] Starting Vite dev server (port 5173)..." -ForegroundColor Yellow
$vite = Start-Process -FilePath "pnpm" -ArgumentList "--filter @bbsim/firm dev" -WorkingDirectory $root -PassThru -NoNewWindow
Start-Sleep -Seconds 3

# Start Zig native shell
Write-Host "[3/3] Building and launching native shell..." -ForegroundColor Yellow
$env:PATH = "C:\zig\zig-x86_64-windows-0.16.0;C:\Users\91952\AppData\Roaming\npm;$env:PATH"
Push-Location "$root\apps\firm"
zig build dev
Pop-Location

# Cleanup on exit
Write-Host ""
Write-Host "Shutting down..." -ForegroundColor Red
if ($api -and !$api.HasExited) { Stop-Process -Id $api.Id -Force -ErrorAction SilentlyContinue }
if ($vite -and !$vite.HasExited) { Stop-Process -Id $vite.Id -Force -ErrorAction SilentlyContinue }
Write-Host "Done." -ForegroundColor Green
