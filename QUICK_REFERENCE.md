# 🚀 MARS Railway Deployment - QUICK REFERENCE CARD

## 📍 You Are Here
✅ All deployment files created
✅ Ready to push to GitHub
✅ Ready to deploy to Railway

---

## 🎯 In 30 Seconds

Your task:
1. **Run script:** `./deploy-railway.sh`
2. **Verify:** No errors reported
3. **Confirm:** Type "y" when asked
4. **Watch:** Railway builds automatically
5. **Test:** Open frontend URL in browser

Result: Public MARS application 🎉

---

## ⚡ Quick Commands

```bash
# Navigate to project
cd /path/to/MARS/research_platform_v2

# Make script executable (first time)
chmod +x deploy-railway.sh

# Run deployment verification and push
./deploy-railway.sh

# Or manual steps:
git add -A
git commit -m "🚀 Deploy to Railway"
git push origin main
```

---

## 🔗 Important URLs (After Deployment)

| URL | Purpose |
|-----|---------|
| `https://mars-frontend-xxx.railway.app` | Public frontend (give this to users) |
| `https://mars-backend-xxx.railway.app/health` | Backend health check |
| `https://mars-backend-xxx.railway.app/docs` | API documentation |

Replace `xxx` with your Railway domain assigned after deployment.

---

## 📋 One-Minute Setup in Railway Dashboard

After GitHub push triggers builds:

1. **Go to:** https://railway.app → Your Project
2. **Check:** Both services show ✅ green status (5-10 min build time)
3. **Add Variable:**
   - Name: `OPENAI_API_KEY`
   - Value: `sk-proj-your_actual_api_key`
   - Type: SECRET ✓
   - Click "Update"
4. **Test:** Open frontend URL
5. **Done!** 🎉

---

## ✅ Success Checklist (Final Test)

```bash
# Test 1: Backend health
curl https://mars-backend-xxx.railway.app/health
# Expected: {"status":"ok"}

# Test 2: Open frontend
# https://mars-frontend-xxx.railway.app
# Expected: React app loads, no errors in console (F12)

# Test 3: Make a query
# Click "Research" → Enter "climate change" → Click "Start"
# Expected: Progress updates, results appear

# Test 4: Verify data persists (optional)
# Restart backend in Railway → Refresh page → History shows previous queries
```

---

## 🛠️ If Something Breaks

| Problem | Check |
|---------|-------|
| Build fails | `docker build -f Dockerfile .` locally |
| Services won't start | Railway → Logs (look for errors) |
| API errors | OPENAI_API_KEY set in Railway Variables? |
| No data | DATABASE_URL path issue (check logs) |
| Slow loading | Check Railway CPU/Memory utilization |

---

## 📚 For More Details

- **Exact steps:** `DEPLOYMENT_SUMMARY.md`
- **Architecture:** `RAILWAY_ARCHITECTURE.md`
- **Deep dive:** `RAILWAY_DEPLOYMENT.md`
- **Complete list:** `COMPLETE_DEPLOYMENT_CHECKLIST.md`

---

## 🚀 Next Action

```bash
./deploy-railway.sh
```

That's it! 🎉

---

**Files Created This Session:**
- ✅ `Dockerfile` (root)
- ✅ `railway.toml`
- ✅ `RAILWAY_DEPLOYMENT.md` (350 lines)
- ✅ `RAILWAY_ARCHITECTURE.md` (500 lines)
- ✅ `DEPLOYMENT_SUMMARY.md` (350 lines)
- ✅ `COMPLETE_DEPLOYMENT_CHECKLIST.md` (400 lines)
- ✅ `deploy-railway.sh` (automation script)
- ✅ `QUICK_REFERENCE.md` (this file)

**Total Documentation:** ~2000 lines
**Time to Deploy:** ~30 minutes
**Difficulty:** Easy ✅ (script automates verification)

---

