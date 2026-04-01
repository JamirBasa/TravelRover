# Railway Backend Environment Variables - Complete Setup

## Required API Keys

Set these in Railway dashboard: **Backend Service → Variables**

### Google APIs (Required for Trip Generation)
```
GOOGLE_GEMINI_AI_API_KEY=AIzaSyDF9-0OXHArhEsMoD1IGJJlKPMYCGn0qvY
GOOGLE_PLACES_API_KEY=AIzaSyD7tbbYPlIHuMMPeccUUhVDeTs9yh_OcRY
GOOGLE_MAPS_API_KEY=AIzaSyD7tbbYPlIHuMMPeccUUhVDeTs9yh_OcRY
```

### SerpAPI (Required for Flight Search)
```
SERPAPI_KEY=7224a02bda43e83ae8f5a3b09732f3360e5fa2293a345c7daf071a33566730f4
```

### Firebase Configuration (Required for Storage & Monitoring)
```
FIREBASE_API_KEY=AIzaSyBhr57j8g5YrJWfS2_OPwTXqkN9u-CDY7s
FIREBASE_PROJECT_ID=travel-rover
FIREBASE_AUTH_DOMAIN=travel-rover.firebaseapp.com
FIREBASE_STORAGE_BUCKET=travel-rover.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=962864296018
FIREBASE_APP_ID=1:962864296018:web:27f8d83ecb7bff5c9aef8b
FIREBASE_MEASUREMENT_ID=G-EFRFM20YNH
```

### Optional APIs
```
LONGCAT_API_KEY=ak_1um9bx5pe5aQ4ZZ8ud41O9Ld2NU8T
```

### Security Settings
```
SECRET_KEY=jm&ggoa2@y_ct$c33r)vluvi-9g7tlc4eyuz1s&sti@=-s%&if
DEBUG=False
```

### Allowed Hosts & CORS
```
ALLOWED_HOSTS=localhost,127.0.0.1,travelrover-production-9217.up.railway.app
CORS_ALLOWED_ORIGINS=https://travel-rover-ph.vercel.app,https://travelrover-production-9217.up.railway.app,http://localhost:5173,http://127.0.0.1:5173
```

### Database
```
DATABASE_URL=postgresql://user:password@postgres-service:5432/railway
```

## Setup Instructions

1. **Go to [Railway Dashboard](https://railway.app)**
2. **Select TravelRover → Backend Service**
3. **Navigate to Variables tab**
4. **Copy and paste each of the above environment variables**
5. **Deploy** (Railway will automatically redeploy with new variables)

## Verification

After deployment, test all endpoints:

```bash
# Health check
curl https://travelrover-production-9217.up.railway.app/api/langgraph/health/

# This should return 200 with components status
```

## System Checks During Startup

The backend runs Django system checks that verify:
- ✅ All API keys are configured
- ✅ Firebase configuration is complete (4/4 keys required)
- ✅ API keys are only in backend (not in frontend)

If you see warnings like:
- **W002: Firebase configuration is incomplete** → Missing Firebase variable on Railway
- **W003: Ensure API keys are only in backend .env** → API keys are correctly in backend only

## Troubleshooting

If Flask logs show "API Unavailable" or timeout:

1. **Check variables are set:**
   - Railway → Backend → Variables
   - Verify all keys have values (not empty)

2. **Restart the service:**
   - Railway → Backend → Settings → Redeploy

3. **Check logs for specific errors:**
   - Railway → Backend → Deployments → View Logs
   - Search for "🔍" or "API key" errors
