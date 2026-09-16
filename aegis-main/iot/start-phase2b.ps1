# AEGIS FLOOD v2.0 - Phase 2B IoT Development Launcher Script
# Terminal 1: Starts FastAPI Gateway over plain HTTP on port 8100
# Terminal 2 Instructions: Explains how to launch Cloudflare Quick Tunnel for Mobile HTTPS

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " AEGIS FLOOD — IoT Phase 2B Development Launcher" -ForegroundColor Header
Write-Host "=======================================================" -ForegroundColor Cyan

$GatewayDir = Join-Path $PSScriptRoot "gateway"
Set-Location $GatewayDir

Write-Host "`n[1/2] Checking cloudflared executable..." -ForegroundColor Yellow
$cloudflaredCmd = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($cloudflaredCmd) {
    Write-Host "  ✓ Found cloudflared in PATH" -ForegroundColor Green
} elseif (Test-Path ".\cloudflared.exe") {
    Write-Host "  ✓ Found .\cloudflared.exe in iot/gateway" -ForegroundColor Green
} else {
    Write-Host "  ⚠ cloudflared not found in PATH or local directory." -ForegroundColor Yellow
    Write-Host "  Run: winget install Cloudflare.cloudflared" -ForegroundColor Yellow
}

Write-Host "`n[2/2] Launching Local FastAPI Gateway on http://localhost:8100..." -ForegroundColor Yellow
Write-Host "-------------------------------------------------------" -ForegroundColor Gray
Write-Host "To expose Mobile HTTPS, open Terminal 2 and run:" -ForegroundColor Cyan
Write-Host "  cloudflared tunnel --url http://localhost:8100" -ForegroundColor Green
Write-Host "  (or .\cloudflared.exe tunnel --url http://localhost:8100)" -ForegroundColor Green
Write-Host "-------------------------------------------------------`n" -ForegroundColor Gray

python -m uvicorn main:app --host 0.0.0.0 --port 8100
