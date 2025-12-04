# 🚀 TravelRover Deployment Guide - Vercel + Railway

**Platform Stack**: Vercel (Frontend) + Railway (Backend)  
**Estimated Time**: 30-45 minutes  
**Difficulty**: Beginner-Friendly

---

## 📋 Prerequisites

### Accounts Needed
- [ ] [Vercel Account](https://vercel.com/signup) (free tier sufficient)
- [ ] [Railway Account](https://railway.app/) (free $5 credit/month)
- [ ] GitHub account (for automatic deployments)
- [ ] Google Cloud Console access (for API keys)
- [ ] Firebase project setup

### Tools Required
```powershell
# Install Vercel CLI
npm i -g vercel

# Install Railway CLI (optional, can use web UI)
npm i -g @railway/cli
```

---

## 🎯 Deployment Strategy

### Why This Stack?

**Vercel** (Frontend):
- ✅ Automatic HTTPS & global CDN
- ✅ Zero-config deployments for Vite
- ✅ Instant rollbacks
- ✅ Preview deployments for branches
- ✅ Free tier: Unlimited bandwidth

**Railway** (Backend):
- ✅ Free PostgreSQL database included
- ✅ Auto-scaling & health checks
- ✅ Environment variables management
- ✅ GitHub integration
- ✅ Free $5 credit/month (enough for side projects)

---

## 🚀 Part 1: Deploy Backend to Railway (15-20 mins)

### Step 1.1: Ensure Code is Pushed to GitHub

Your backend is already in the TravelRover repository:
```
https://github.com/JamirBasa/TravelRover/tree/dave-jamir-basa
```

Ensure latest changes are pushed:
```powershell
# From project root
git add .
git commit -m "Prepare backend for Railway deployment"
git push origin dave-jamir-basa
```

### Step 1.2: Create Railway Project

1. **Go to** [railway.app/new](https://railway.app/new)
2. **Click** "Deploy from GitHub repo"
3. **Select** `JamirBasa/TravelRover` repository
4. **Important**: Set **Root Directory** to `travel-backend`
5. **Select branch**: `dave-jamir-basa` (or merge to main first)
6. **Railway will**:
   - Auto-detect Django from the subdirectory
   - Use `Procfile` and `railway.json` from `travel-backend/`
   - Set up automatic deployments

### Step 1.3: Add PostgreSQL Database

1. In Railway dashboard → **"New" → "Database" → "PostgreSQL"**
2. Railway auto-connects it (creates `DATABASE_URL` variable)
3. **Verify**: Check "Variables" tab for `DATABASE_URL`

### Step 1.4: Configure Environment Variables

In Railway dashboard → **"Variables" tab** → Add:

```env
# Django Configuration
SECRET_KEY=your-super-secret-key-generate-new-one
DEBUG=False
ALLOWED_HOSTS=.railway.app,.vercel.app,yourdomain.com
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://yourdomain.com

# Database (Auto-created by Railway)
DATABASE_URL=${{ Postgres.DATABASE_URL }}

# API Keys (Required)
SERPAPI_KEY=your_serpapi_key_here
GOOGLE_PLACES_API_KEY=your_google_places_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
GOOGLE_GEMINI_AI_API_KEY=your_gemini_api_key
LONGCAT_API_KEY=your_longcat_key

# Firebase (Optional for backend API monitoring)
FIREBASE_API_KEY=your_firebase_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abc123
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Security Settings
SECURE_SSL_REDIRECT=True
```

### Step 1.5: Deploy Backend

Railway auto-deploys on push. To manually trigger:

1. **Dashboard** → "Deployments" → "Deploy"
2. **Wait** for build (3-5 minutes)
3. **Copy** your Railway URL: `https://your-backend.up.railway.app`

### Step 1.6: Verify Backend Deployment

```powershell
# Test health endpoint
curl https://your-backend.up.railway.app/api/langgraph/health/

# Expected response:
# {"status": "healthy", "version": "1.0", "timestamp": "..."}
```

### Step 1.7: Run Database Migrations

Railway runs migrations automatically via `railway.json`. Verify:

```powershell
# In Railway dashboard → "Logs" tab
# Look for: "Running migrations... OK"
```

---

## 🌐 Part 2: Deploy Frontend to Vercel (10-15 mins)

### Step 2.1: Prepare Frontend Repository

```powershell
cd ..  # Back to project root (TravelRover/)

# Verify vercel.json exists
cat vercel.json

# Commit changes
git add .
git commit -m "Add Vercel deployment config"
git push
```

### Step 2.2: Connect to Vercel

**Option A: Web UI (Recommended for first deployment)**

1. **Go to** [vercel.com/new](https://vercel.com/new)
2. **Import** your GitHub repository
3. **Configure**:
   - Framework Preset: **Vite**
   - Root Directory: **/** (or leave default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)

**Option B: CLI (For advanced users)**

```powershell
# From project root
vercel

# Follow prompts:
# - Link to existing project? N
# - Project name: travelrover
# - Directory: ./ (current)
# - Override settings? N
```

### Step 2.3: Configure Environment Variables

In Vercel dashboard → **"Settings" → "Environment Variables"**

Add these (replace with your actual values):

```env
# Google APIs
VITE_GOOGLE_PLACES_API_KEY=AIza...your_actual_key
VITE_GOOGLE_MAPS_API_KEY=AIza...your_actual_key

# Firebase (Frontend)
VITE_FIREBASE_API_KEY=AIza...your_actual_key
VITE_FIREBASE_AUTH_DOMAIN=travelrover-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=travelrover-xxx
VITE_FIREBASE_STORAGE_BUCKET=travelrover-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend API (CRITICAL - use your Railway URL)
VITE_API_BASE_URL=https://your-backend.up.railway.app

# OAuth
VITE_GOOGLE_AUTH_CLIENT_ID=123456789012-abc123.apps.googleusercontent.com

# Proxy Configuration
VITE_USE_GEMINI_PROXY=true

# Optional Services
VITE_OPENWEATHER_API_KEY=your_key_here
VITE_UNSPLASH_ACCESS_KEY=your_key_here
```

**Important**: Click **"Add"** for each variable, then **"Save"**

### Step 2.4: Deploy to Vercel

```powershell
# From project root
vercel --prod

# Or use web UI: "Deployments" → "Redeploy"
```

**Deployment takes**: 2-3 minutes

### Step 2.5: Get Your Production URLs

After successful deployment:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.up.railway.app`

**Copy these URLs** - you'll need them for final configuration!

---

## 🔧 Part 3: Final Configuration (10 mins)

### Step 3.1: Update CORS in Railway

Now that you have your Vercel URL, update Railway variables:

```env
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://yourdomain.com
ALLOWED_HOSTS=.railway.app,.vercel.app,yourdomain.com
```

Railway auto-redeploys when variables change.

### Step 3.2: Configure Firebase OAuth

1. **Firebase Console** → Authentication → Sign-in method
2. **Add domain** to authorized: `your-app.vercel.app`

3. **Google Cloud Console** → Credentials → OAuth 2.0 Client
4. **Add** to Authorized JavaScript origins:
   - `https://your-app.vercel.app`
5. **Add** to Authorized redirect URIs:
   - `https://your-app.vercel.app/__/auth/handler`

### Step 3.3: Update Google API Key Restrictions

**Google Cloud Console** → Credentials → API Keys

For each key, add to **Application restrictions**:
- HTTP referrers: `https://your-app.vercel.app/*`

### Step 3.4: Test Production Deployment

```powershell
# Test backend
curl https://your-backend.up.railway.app/api/langgraph/health/

# Test frontend (open in browser)
start https://your-app.vercel.app
```

---

## ✅ Verification Checklist

### Backend Health Checks
- [ ] `/api/langgraph/health/` returns 200 OK
- [ ] PostgreSQL connection working (check logs)
- [ ] Static files serving correctly
- [ ] CORS headers present in responses

### Frontend Functionality
- [ ] App loads without console errors
- [ ] Google Maps renders properly
- [ ] OAuth login works
- [ ] Create trip functionality works
- [ ] Trip itinerary displays correctly
- [ ] Hotel booking links work

### Integration Tests
- [ ] Frontend can call backend APIs
- [ ] Trip creation saves to Firebase
- [ ] LangGraph agent generates itineraries
- [ ] Real-time features work (maps, weather)

---

## 🐛 Troubleshooting

### Issue: "Application Error" on Railway

**Check Logs**: Railway Dashboard → Logs

Common causes:
- Missing environment variables
- Database migration failed
- Gunicorn startup error

**Fix**:
```powershell
# Verify all env vars are set
# Check DATABASE_URL exists
# Ensure SECRET_KEY is set
```

### Issue: Blank Page on Vercel

**Check Browser Console**: F12 → Console

Common causes:
- Missing `VITE_API_BASE_URL`
- Incorrect Firebase config
- CORS errors

**Fix**:
```powershell
# Verify all VITE_* variables in Vercel
# Check CORS_ALLOWED_ORIGINS includes Vercel URL
```

### Issue: "CORS Policy" Errors

**Symptoms**: Network requests blocked in browser

**Fix**:
1. Update Railway `CORS_ALLOWED_ORIGINS` with your Vercel URL
2. Ensure URL format: `https://your-app.vercel.app` (no trailing slash)
3. Railway auto-redeploys on variable change

### Issue: OAuth Login Fails

**Symptoms**: Redirect error or "Unauthorized domain"

**Fix**:
1. Firebase Console → Add `your-app.vercel.app` to authorized domains
2. Google Cloud Console → Add to OAuth redirect URIs
3. Clear browser cookies and retry

### Issue: 502 Bad Gateway on API Calls

**Symptoms**: Frontend can't reach backend

**Fix**:
1. Verify `VITE_API_BASE_URL` in Vercel matches Railway URL
2. Check Railway deployment status (must be "Active")
3. Test backend directly: `curl https://your-backend.up.railway.app/api/langgraph/health/`

---

## 📊 Monitoring Setup

### Railway Monitoring

1. **Dashboard** → "Metrics" tab
2. Monitor:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

### Vercel Analytics

1. **Dashboard** → "Analytics" tab
2. Metrics:
   - Page views
   - Unique visitors
   - Performance scores

### Set Up Alerts

**Railway**:
- Dashboard → "Settings" → "Notifications"
- Enable deployment failure alerts

**Vercel**:
- Dashboard → "Settings" → "Integrations"
- Connect to Slack/Discord for alerts

---

## 🔄 Continuous Deployment

### Automatic Deployments

**Vercel** (auto-configured):
- Push to `main` → Production deploy
- Push to feature branch → Preview deploy

**Railway** (auto-configured):
- Push to `main` → Production deploy
- Check "Deployments" tab for status

### Manual Deployment

**Vercel**:
```powershell
vercel --prod
```

**Railway**:
```powershell
railway up
# Or use web UI: "Redeploy"
```

---

## 💰 Cost Estimate

### Free Tier Limits

**Vercel Free**:
- ✅ Unlimited bandwidth
- ✅ Unlimited deployments
- ✅ 100 GB-hours compute

**Railway Free**:
- ✅ $5 credit/month
- ✅ ~500 hours runtime (low traffic)
- ✅ PostgreSQL database included

### Expected Monthly Cost

**Development/Side Project**: **$0** (free tiers sufficient)

**Production (moderate traffic)**:
- Vercel: $0-20 (free tier usually enough)
- Railway: $5-15 (after free credit)
- **Total**: ~$5-35/month

---

## 🎉 Success!

Your TravelRover app is now live! 🚀

**Production URLs**:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.up.railway.app`

### Next Steps:
1. ✅ Add custom domain (optional)
2. ✅ Set up monitoring (Sentry)
3. ✅ Configure analytics (Google Analytics)
4. ✅ Enable CDN caching (Cloudflare)
5. ✅ Set up backup strategy

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [TravelRover Production Audit](./PRODUCTION_READINESS_AUDIT.md)

**Need help?** Check the troubleshooting section or review deployment logs!
