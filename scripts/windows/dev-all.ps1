# QALGO — Start Full Development Environment
# Usage: .\scripts\windows\dev-all.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$env:PATH = "$env:USERPROFILE\.cargo\bin;C:\Users\91952\AppData\Local\pnpm\bin;$env:PATH"
$pnpm = "C:\Users\91952\AppData\Local\pnpm\bin\pnpm.cmd"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  QALGO — Full Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Start API
Write-Host "[1/2] Starting API server..." -ForegroundColor Yellow
$api = Start-Process -FilePath $pnpm -ArgumentList "--filter","@qalgo/api","dev" -PassThru -WindowStyle Hidden -WorkingDirectory $root
Start-Sleep -Seconds 3

# Start App Tauri (foreground)
Write-Host "[2/2] Launching App..." -ForegroundColor Yellow
Push-Location "$root\apps\firm"
& $pnpm tauri:dev
Pop-Location

# Cleanup
Write-Host "Shutting down..." -ForegroundColor Red
if ($api -and !$api.HasExited) { Stop-Process -Id $api.Id -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 3001,5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
