# BBSIM — Start Trader (User) Desktop App with Tauri
# Usage: .\scripts\windows\dev-trader.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$env:PATH = "$env:USERPROFILE\.cargo\bin;C:\Users\91952\AppData\Local\pnpm\bin;$env:PATH"

Write-Host "Starting BBSIM Trader (User Side)..." -ForegroundColor Cyan

# Start API server in background
$pnpm = "C:\Users\91952\AppData\Local\pnpm\bin\pnpm.cmd"
Write-Host "[1/2] Starting API server (port 3001)..." -ForegroundColor Yellow
$api = Start-Process -FilePath $pnpm -ArgumentList "--filter","@bbsim/api","dev" -PassThru -WindowStyle Hidden -WorkingDirectory $root
Start-Sleep -Seconds 3

# Launch Tauri (handles Vite + native window)
Write-Host "[2/2] Launching Tauri desktop app..." -ForegroundColor Yellow
Push-Location "$root\apps\trader"
& $pnpm tauri:dev
Pop-Location

# Cleanup
Write-Host "Shutting down..." -ForegroundColor Red
if ($api -and !$api.HasExited) { Stop-Process -Id $api.Id -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 3001,5174 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
