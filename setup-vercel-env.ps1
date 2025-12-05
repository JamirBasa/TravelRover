# Quick script to set Vercel environment variable
# Run: vercel env add VITE_API_BASE_URL

Write-Host "Setting up Vercel environment variable..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Run this command:" -ForegroundColor Yellow
Write-Host "  vercel env add VITE_API_BASE_URL production" -ForegroundColor Green
Write-Host ""
Write-Host "When prompted, enter:" -ForegroundColor Yellow
Write-Host "  https://travelrover-production.up.railway.app/api" -ForegroundColor Green
Write-Host ""
Write-Host "Then redeploy:" -ForegroundColor Yellow
Write-Host "  vercel --prod" -ForegroundColor Green
