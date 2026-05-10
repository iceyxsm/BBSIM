# BBSIM — Start Everything (Both Apps + API)
# Starts: API server + Firm frontend + Trader frontend + Both native shells
# Usage: .\scripts\dev-all.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$env:PATH = "C:\zig\zig-x86_64-windows-0.16.0;C:\Users\91952\AppData\Roaming\npm;$env:PATH"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BBSIM — Full Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start API server
Write-Host "[1/5] Starting API server (port 3001)..." -ForegroundColor Yellow
$api = Start-Process -FilePath "pnpm" -ArgumentList "--filter @bbsim/api dev" -WorkingDirectory $root -PassThru -NoNewWindow
Start-Sleep -Seconds 2

# Start Firm Vite
Write-Host "[2/5] Starting Firm frontend (port 5173)..." -ForegroundColor Yellow
$firmVite = Start-Process -FilePath "pnpm" -ArgumentList "--filter @bbsim/firm dev" -WorkingDirectory $root -PassThru -NoNewWindow
Start-Sleep -Seconds 2

# Start Trader Vite
Write-Host "[3/5] Starting Trader frontend (port 5174)..." -ForegroundColor Yellow
$traderVite = Start-Process -FilePath "pnpm" -ArgumentList "--filter @bbsim/trader dev" -WorkingDirectory $root -PassThru -NoNewWindow
Start-Sleep -Seconds 3

# Build and launch Firm native shell
Write-Host "[4/5] Building Firm native shell..." -ForegroundColor Yellow
$firm = Start-Process -FilePath "zig" -ArgumentList "build dev" -WorkingDirectory "$root\apps\firm" -PassThru -NoNewWindow
Start-Sleep -Seconds 5

# Build and launch Trader native shell
Write-Host "[5/5] Building Trader native shell..." -ForegroundColor Yellow
Push-Location "$root\apps\trader"
zig build dev
Pop-Location

# Cleanup on exit
Write-Host ""
Write-Host "Shutting down all processes..." -ForegroundColor Red
$procs = @($api, $firmVite, $traderVite, $firm)
foreach ($p in $procs) {
    if ($p -and !$p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
}
Write-Host "Done." -ForegroundColor Green
