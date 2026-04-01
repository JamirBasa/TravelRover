# Railway Deployment CORS Fix Guide

## ✅ Quick Checklist

### 1. Environment Variables on Railway
Go to [Railway Dashboard](https://railway.app/dashboard) → Your Project → Settings → Environment Variables

**Verify these are set:**

```
# Must be set exactly like this (no trailing slashes)
CORS_ALLOWED_ORIGINS=https://travel-rover-ph.vercel.app,https://travelrover-production-9217.up.railway.app,http://localhost:5173

# Other required variables (check .env file for all)
ALLOWED_HOSTS=localhost,127.0.0.1,travelrover-production-9217.up.railway.app
DEBUG=False
SECRET_KEY=jm&ggoa2@y_ct$c33r)vluvi-9g7tlc4eyuz1s&sti@=-s%&if
GOOGLE_GEMINI_AI_API_KEY=AIzaSyDF9-0OXHArhEsMoD1IGJJlKPMYCGn0qvY
# ... other API keys ...
```

**✅ Format Rules:**
- No trailing slashes on URLs
- Comma-separated, no spaces (spaces are stripped automatically)
- Must include https:// for production URLs

---

## 2. Test CORS Health Endpoint

Before testing transport-mode, verify the backend can handle CORS:

```bash
# Test from your browser console or curl
curl -i -X OPTIONS \
  -H "Origin: https://travel-rover-ph.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Content-Type: application/json" \
  https://travelrover-production-9217.up.railway.app/api/langgraph/transport-mode/
```

**Expected response headers:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://travel-rover-ph.vercel.app
Access-Control-Allow-Methods: POST, OPTIONS, GET, HEAD, PUT, PATCH, DELETE
Access-Control-Allow-Headers: accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with
Access-Control-Allow-Credentials: true
```

---

## 3. Troubleshooting Steps

### If CORS still fails:

**Step A: Check Django Config**
```bash
# SSH into Railway container or check logs
python manage.py shell < verify_cors.py
```

Expected output:
```
CORS_ALLOWED_ORIGINS:
   - https://travel-rover-ph.vercel.app
   - https://travelrover-production-9217.up.railway.app
   - http://localhost:5173
```

**Step B: Check Django Logs**
```bash
# In Railway dashboard, view recent logs
tail -f logs
```

Look for CORS-related messages or 405 errors.

**Step C: Test Health Endpoint First**
```
GET https://travelrover-production-9217.up.railway.app/api/langgraph/health/
```

If this fails, the backend isn't responding properly.

---

## 4. Deploy to Railway

### Option A: Using Git Push (Recommended)
```bash
cd c:\Users\User\Documents\GitHub\TravelRover
git add -A
git commit -m "Fix: CORS configuration for Railway deployment"
git push origin main  # If Railway is connected to main branch
```

### Option B: Manual Railway CLI
```bash
# Install Railway CLI if needed
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy backend
cd travel-backend
railway up
```

---

## 5. Post-Deployment Test

### Test from Frontend:
1. Go to https://travel-rover-ph.vercel.app
2. Open DevTools (F12) → Console
3. Try creating a trip
4. Check Network tab for `/api/langgraph/transport-mode/` request
5. Verify response has correct CORS headers

### Test from Command Line:
```powershell
# PowerShell - test OPTIONS preflight
$headers = @{
    'Origin' = 'https://travel-rover-ph.vercel.app'
    'Access-Control-Request-Method' = 'POST'
    'Content-Type' = 'application/json'
}

$response = Invoke-WebRequest `
    -Method OPTIONS `
    -Uri 'https://travelrover-production-9217.up.railway.app/api/langgraph/transport-mode/' `
    -Headers $headers `
    -SkipHttpErrorCheck

Write-Host "Status: $($response.StatusCode)"
Write-Host "CORS Headers:"
$response.Headers | Where-Object { $_ -like '*Access-Control*' } | ForEach-Object {
    Write-Host "  $($_): $($response.Headers[$_])"
}
```

---

## 6. If CORS Still Doesn't Work

### Fallback: Use Backend Proxy

If CORS remains problematic, modify the frontend to call a local proxy endpoint instead:

```javascript
// In transportModeApi.js
const TRANSPORT_MODE_URL = `${BACKEND_BASE_URL}/langgraph/transport-mode/`;

// OR use backend proxy if available
// const TRANSPORT_MODE_URL = `${BACKEND_BASE_URL}/proxy/transport-mode/`;
```

Then add a view on Django that proxies to the actual endpoint (already CORS-enabled).

---

## 7. Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `No 'Access-Control-Allow-Origin' header` | CORS not enabled in Django | Verify middleware position & CORS_ALLOWED_ORIGINS |
| `OPTIONS 405 Method Not Allowed` | AllowAny permission not set | Ensure REST_FRAMEWORK has AllowAny |
| `OPTIONS 404 Not Found` | Endpoint doesn't exist | Verify URL path in langgraph_agents/urls.py |
| `net::ERR_FAILED` | Network/firewall issue | Check Railway networking, SSL certificates |
| CORS works locally but not on Railway | Environment variable not set | Verify CORS_ALLOWED_ORIGINS in Railway dashboard |

---

## 8. Verify Everything Works

Once deployed, you should see:

✅ Health check returns 200 with CORS headers
✅ Transport mode endpoint accepts preflight OPTIONS request  
✅ POST request to transport-mode succeeds with correct data
✅ Frontend can create trips without CORS errors
✅ Network tab shows `Access-Control-Allow-Origin` header

---

## Need Help?

1. Check Rails logs: `railway logs --follow`
2. Test health: `curl https://travelrover-production-9217.up.railway.app/api/langgraph/health/`
3. SSH into container: `railway shell`
4. View environment: `railway env`

