# 🚀 TravelRover - Quick Deploy Script
# Automated deployment to Vercel + Railway

Write-Host "🚀 TravelRover Deployment Assistant" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check if required tools are installed
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

$allGood = $true

if (-not (Test-Command "git")) {
    Write-Host "❌ Git not found. Please install Git first." -ForegroundColor Red
    $allGood = $false
} else {
    Write-Host "✅ Git installed" -ForegroundColor Green
}

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    $allGood = $false
} else {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed ($nodeVersion)" -ForegroundColor Green
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    $allGood = $false
} else {
    Write-Host "✅ npm installed" -ForegroundColor Green
}

if (-not $allGood) {
    Write-Host ""
    Write-Host "❌ Missing required tools. Please install them and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Checking for Vercel CLI..." -ForegroundColor Yellow

if (-not (Test-Command "vercel")) {
    Write-Host "⚠️ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Deployment Options:" -ForegroundColor Cyan
Write-Host "1. Deploy Frontend to Vercel"
Write-Host "2. Setup Backend for Railway"
Write-Host "3. Deploy Both (Recommended)"
Write-Host "4. Verify Deployment"
Write-Host "5. Exit"
Write-Host ""

$choice = Read-Host "Select option (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🌐 Deploying Frontend to Vercel..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check if .env exists
        if (-not (Test-Path ".env")) {
            Write-Host "⚠️ Warning: .env file not found" -ForegroundColor Yellow
            Write-Host "Environment variables will need to be configured in Vercel dashboard" -ForegroundColor Yellow
            Write-Host ""
        }
        
        Write-Host "Running production build..." -ForegroundColor Yellow
        npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Build successful!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
            vercel --prod
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
                Write-Host ""
                Write-Host "📝 Next Steps:" -ForegroundColor Cyan
                Write-Host "1. Go to Vercel dashboard: https://vercel.com/dashboard"
                Write-Host "2. Navigate to Settings → Environment Variables"
                Write-Host "3. Add all VITE_* variables from .env.example"
                Write-Host "4. Redeploy to apply environment variables"
            } else {
                Write-Host "❌ Deployment failed. Check error messages above." -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Build failed. Please fix errors and try again." -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "🗄️ Preparing Backend for Railway..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check if backend directory exists
        if (-not (Test-Path "travel-backend")) {
            Write-Host "❌ Backend directory not found!" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "Checking configuration files..." -ForegroundColor Yellow
        
        $configFiles = @("Procfile", "railway.json", "nixpacks.toml", "requirements.txt")
        $allFilesExist = $true
        
        foreach ($file in $configFiles) {
            $filePath = "travel-backend/$file"
            if (Test-Path $filePath) {
                Write-Host "✅ $file found" -ForegroundColor Green
            } else {
                Write-Host "❌ $file missing" -ForegroundColor Red
                $allFilesExist = $false
            }
        }
        
        if ($allFilesExist) {
            Write-Host ""
            Write-Host "✅ All configuration files ready!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📝 Railway Deployment Steps:" -ForegroundColor Cyan
            Write-Host "1. Go to https://railway.app/new"
            Write-Host "2. Click 'Deploy from GitHub repo'"
            Write-Host "3. Select your backend repository"
            Write-Host "4. Add PostgreSQL database (New → Database → PostgreSQL)"
            Write-Host "5. Configure environment variables (see .env.example)"
            Write-Host "6. Railway will auto-deploy!"
            Write-Host ""
            Write-Host "Required Environment Variables:" -ForegroundColor Yellow
            Write-Host "- SECRET_KEY (generate new)"
            Write-Host "- DEBUG=False"
            Write-Host "- ALLOWED_HOSTS=.railway.app,.vercel.app"
            Write-Host "- CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app"
            Write-Host "- SERPAPI_KEY, GOOGLE_PLACES_API_KEY, GOOGLE_MAPS_API_KEY"
            Write-Host "- GOOGLE_GEMINI_AI_API_KEY, LONGCAT_API_KEY"
            Write-Host "- DATABASE_URL (auto-created by Railway PostgreSQL)"
        } else {
            Write-Host ""
            Write-Host "❌ Some configuration files are missing." -ForegroundColor Red
            Write-Host "Please run the deployment setup script first." -ForegroundColor Yellow
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "🚀 Full Deployment (Frontend + Backend)" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "Step 1/2: Building Frontend..." -ForegroundColor Yellow
        npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend build successful!" -ForegroundColor Green
            Write-Host ""
            
            Write-Host "Step 2/2: Deploying to Vercel..." -ForegroundColor Yellow
            vercel --prod
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ Frontend deployed!" -ForegroundColor Green
                Write-Host ""
                
                Write-Host "📝 Backend Deployment:" -ForegroundColor Cyan
                Write-Host "Railway deployment is done via web UI:" -ForegroundColor Yellow
                Write-Host "1. Visit: https://railway.app/new"
                Write-Host "2. Deploy from GitHub"
                Write-Host "3. Add PostgreSQL database"
                Write-Host "4. Configure environment variables"
                Write-Host ""
                Write-Host "See docs/VERCEL_RAILWAY_DEPLOYMENT.md for detailed steps" -ForegroundColor Cyan
            }
        } else {
            Write-Host "❌ Frontend build failed. Cannot proceed with deployment." -ForegroundColor Red
        }
    }
    
    "4" {
        Write-Host ""
        Write-Host "🔍 Verifying Deployment..." -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "Enter your Vercel app URL (e.g., https://your-app.vercel.app):" -ForegroundColor Yellow
        $frontendUrl = Read-Host "Frontend URL"
        
        Write-Host "Enter your Railway backend URL (e.g., https://your-backend.up.railway.app):" -ForegroundColor Yellow
        $backendUrl = Read-Host "Backend URL"
        
        Write-Host ""
        Write-Host "Testing backend health..." -ForegroundColor Yellow
        
        try {
            $response = Invoke-WebRequest -Uri "$backendUrl/api/langgraph/health/" -Method Get -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Backend is healthy!" -ForegroundColor Green
                Write-Host "Response: $($response.Content)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "❌ Backend health check failed" -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "Opening frontend in browser..." -ForegroundColor Yellow
        Start-Process $frontendUrl
        
        Write-Host ""
        Write-Host "📋 Manual Verification Checklist:" -ForegroundColor Cyan
        Write-Host "□ Frontend loads without errors"
        Write-Host "□ Google Maps renders"
        Write-Host "□ OAuth login works"
        Write-Host "□ Create trip functionality"
        Write-Host "□ View existing trips"
        Write-Host "□ Hotel booking links work"
    }
    
    "5" {
        Write-Host ""
        Write-Host "👋 Goodbye!" -ForegroundColor Cyan
        exit 0
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Invalid option. Please select 1-5." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✨ Deployment script complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 For detailed documentation, see:" -ForegroundColor Cyan
Write-Host "docs/VERCEL_RAILWAY_DEPLOYMENT.md"
Write-Host ""
