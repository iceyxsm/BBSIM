# BBSIM — Start Everything with Tauri
# Usage: .\scripts\windows\dev-all.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$env:PATH = "$env:USERPROFILE\.cargo\bin;C:\Users\91952\AppData\Local\pnpm\bin;$env:PATH"
$pnpm = "C:\Users\91952\AppData\Local\pnpm\bin\pnpm.cmd"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BBSIM — Full Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Start API
Write-Host "[1/3] Starting API server..." -ForegroundColor Yellow
$api = Start-Process -FilePath $pnpm -ArgumentList "--filter","@bbsim/api","dev" -PassThru -WindowStyle Hidden -WorkingDirectory $root
Start-Sleep -Seconds 3

# Start Firm Tauri
Write-Host "[2/3] Launching Firm app..." -ForegroundColor Yellow
$firm = Start-Process -FilePath $pnpm -ArgumentList "--filter","@bbsim/firm","tauri:dev" -PassThru -WorkingDirectory $root
Start-Sleep -Seconds 2

# Start Trader Tauri (foreground)
Write-Host "[3/3] Launching Trader app..." -ForegroundColor Yellow
Push-Location "$root\apps\trader"
& $pnpm tauri:dev
Pop-Location

# Cleanup
Write-Host "Shutting down..." -ForegroundColor Red
if ($api -and !$api.HasExited) { Stop-Process -Id $api.Id -Force -ErrorAction SilentlyContinue }
if ($firm -and !$firm.HasExited) { Stop-Process -Id $firm.Id -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 3001,5173,5174 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
