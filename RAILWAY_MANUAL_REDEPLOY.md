# Railway Manual Redeploy Guide - CORS Fix

## ✅ Step 1: Verify Code is Pushed

Your code is now pushed with production URLs in CORS defaults. Confirm:

```bash
git log --oneline -3
```

You should see: `Fix: Add production URLs to CORS defaults for Railway`

---

## 🔄 Step 2: Force Redeploy on Railway

Railway **might be caching** the old deployment. Force a fresh redeploy:

### **Option A: Manual Redeploy via Railway Dashboard** (Recommended)

1. Go to https://railway.app/dashboard
2. Select **TravelRover** project
3. Click on the **backend** deployment
4. Go to **Deployments** tab
5. Find the latest deployment (should say "eb8c1bd5" or newer commit hash)
6. Click the **⋮ (three dots)** menu
7. Select **Redeploy** or **Rebuild**
8. Wait 2-3 minutes for deployment to complete

### **Option B: Trigger Rebuild via Environment Change**

If manual redeploy doesn't work, add a dummy env var and remove it to trigger a rebuild:

1. Go to Railway Project → Settings → Variables
2. Add: `FORCE_REBUILD=true`
3. Wait for auto-redeploy (Railway triggers on env change)
4. Once deployed, remove `FORCE_REBUILD=true`
5. Delete it and save

### **Option C: Check Deployment Logs**

During redeploy, monitor the logs:

1. Dashboard → Deployments tab
2. Click latest deployment
3. Click **View logs**
4. Look for:
   ```
   Successfully built...
   Starting Django server...
   ```
5. If you see errors, screenshot and share them

---

## 🧪 Step 3: Test CORS After Redeploy

Once redeploy completes, test with the CORS debug endpoint:

### **Test 1: Browser Console Test**

Go to https://travel-rover-ph.vercel.app and open DevTools (F12 → Console):

```javascript
// Simple test - should return CORS headers
fetch('https://travelrover-production-9217.up.railway.app/api/langgraph/cors-debug/', {
  method: 'POST',
  mode: 'cors',
  credentials: 'omit',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({test: true})
})
.then(r => {
  console.log('Status:', r.status);
  console.log('CORS Headers:');
  console.log('  Access-Control-Allow-Origin:', r.headers.get('Access-Control-Allow-Origin'));
  console.log('  Access-Control-Allow-Credentials:', r.headers.get('Access-Control-Allow-Credentials'));
  return r.json();
})
.then(data => console.log('Response:', JSON.stringify(data, null, 2)))
.catch(e => console.error('Error:', e));
```

**Expected output:**
```
Status: 200
CORS Headers:
  Access-Control-Allow-Origin: https://travel-rover-ph.vercel.app
  Access-Control-Allow-Credentials: true
Response: {
  "allowed_origins": [
    "https://travel-rover-ph.vercel.app",
    "https://travelrover-production-9217.up.railway.app",
    ...
  ],
  ...
}
```

### **Test 2: Raw Debug Endpoint**

```javascript
fetch('https://travelrover-production-9217.up.railway.app/api/langgraph/cors-debug-raw/', {
  method: 'GET'
})
.then(r => {
  console.log('✅ Headers:', Object.fromEntries(r.headers));
  return r.text();
})
.then(text => console.log(JSON.parse(text)));
```

### **Test 3: Actual Transport Mode Endpoint**

Once debug endpoints work, test the real one:

```javascript
fetch('https://travelrover-production-9217.up.railway.app/api/langgraph/transport-mode/', {
  method: 'POST',
  mode: 'cors',
  credentials: 'omit',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    departure_city: 'Manila',
    destination: 'Baguio',
    include_flights: true
  })
})
.then(r => {
  console.log('Status:', r.status);
  if (r.ok) {
    return r.json();
  } else {
    console.error('HTTP Error:', r.status, r.statusText);
  }
})
.then(data => console.log('✅ Success:', data))
.catch(e => console.error('❌ Error:', e));
```

---

## 🔍 Step 4: If CORS Still Fails

### **Check Middleware Order**

The `CorsMiddleware` MUST be first. Run locally:

```bash
cd travel-backend
python manage.py shell
```

Then in the shell:
```python
from django.conf import settings
print("First 5 middleware:")
for i, m in enumerate(settings.MIDDLEWARE[:5]):
    print(f"{i+1}. {m}")

if settings.MIDDLEWARE[0] == 'corsheaders.middleware.CorsMiddleware':
    print("✅ CorsMiddleware is FIRST")
else:
    print("❌ ERROR: CorsMiddleware is NOT first!")
```

**If not first, that's the bug!** It's already correct in your code though.

### **Check CORS Origins Loaded**

In same shell session:
```python
print("\nCORS_ALLOWED_ORIGINS:")
for origin in settings.CORS_ALLOWED_ORIGINS:
    print(f"  - {origin}")

print(f"\nDEBUG mode: {settings.DEBUG}")
```

Should show both localhost AND production URLs.

### **Check Django Logs on Railway**

Monitor logs while testing:

```bash
# If Railway CLI is installed
railway logs --follow

# Or in Dashboard: Deployments → Latest → View Logs (scroll in real-time)
```

Look for:
- CORS rejection errors
- 405 Method Not Allowed (means middleware not running)
- 404 (endpoint doesn't exist)

---

## ⚠️ Common Issues & Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| `No 'Access-Control-Allow-Origin'` | Middleware not first OR caching | Redeploy + check middleware order |
| `405 Method Not Allowed` | OPTIONS not allowed | Middleware should handle this automatically |
| `CORS works locally but not Railway` | DEBUG=True locally vs False on Railway | Settings change affects CORS defaults |
| Response shows wrong origin | CORS_ALLOWED_ORIGINS not including Vercel URL | Check debug endpoint output |
| Empty `CORS_ALLOWED_ORIGINS` list | Tried to use wildcard with credentials | Fixed - now using explicit URLs |

---

## 📋 Checklist Before Giving Up

- [ ] Git push completed successfully
- [ ] Railway redeploy triggered (watch logs to completion)
- [ ] Tested with cors-debug endpoint from browser console
- [ ] Response shows `Access-Control-Allow-Origin` header
- [ ] CORS_ALLOWED_ORIGINS includes both Vercel and Railway URLs
- [ ] Created fresh trip - no CORS errors
- [ ] Checked Railway logs - no errors related to CORS

---

## 🚀 If All Tests Pass

You should see:
- ✅ transport-mode endpoint responds with CORS headers
- ✅ Browser console shows no CORS errors
- ✅ Trip creation works end-to-end
- ✅ Places search works
- ✅ All endpoints accessible from Vercel frontend

🎉 **CORS is fixed!**

---

## 📞 Need Help?

Share:
1. Output of `cors-debug` endpoint (paste full JSON response)
2. Railway deployment logs (last 50 lines from redeploy)
3. Browser console error message (exact CORS error text)
4. Screenshot of Railway Variables page (for CORS_ALLOWED_ORIGINS)

