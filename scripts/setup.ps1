# Private Cloud — Windows setup helper
# Run from repo root:  powershell -ExecutionPolicy Bypass -File scripts/setup.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "==> Checking Node..." -ForegroundColor Cyan
node -v

Write-Host "==> Installing pnpm@9.1.0 globally (if missing)..." -ForegroundColor Cyan
$pnpmCmd = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpmCmd) {
  npm install -g pnpm@9.1.0
} else {
  Write-Host "pnpm already on PATH: $($pnpmCmd.Source)"
}
pnpm -v

if (Test-Path "node_modules") {
  Write-Host "==> Removing node_modules (clean install)..." -ForegroundColor Yellow
  Remove-Item -Recurse -Force node_modules
}

Write-Host "==> pnpm install..." -ForegroundColor Cyan
pnpm install

Write-Host ""
Write-Host "Done. Next steps:" -ForegroundColor Green
Write-Host "  1. Copy apps\web\.env.local.example to apps\web\.env.local"
Write-Host "  2. pnpm dev"
