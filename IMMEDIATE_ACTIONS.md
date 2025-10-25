# 🚨 IMMEDIATE SECURITY ACTIONS REQUIRED

## ⚠️ Your API Key Was Exposed - Act Now!

The following credential was publicly exposed on GitHub:
- **API Key**: `AIzaSyA0cAK5_UDPIt37-9q-jSFixTNfiOlFtLk`
- **Project**: `fast-food-manager-b1f54`

---

## 🔥 URGENT: Do These Now (15 minutes)

### 1. Delete Exposed API Key

**Option A: Via Google Cloud Console (Recommended)**
```
1. Visit: https://console.cloud.google.com/apis/credentials?project=fast-food-manager-b1f54
2. Find key: AIzaSyA0cAK5_UDPIt37-9q-jSFixTNfiOlFtLk
3. Click trash icon → Confirm deletion
```

**Option B: Via gcloud CLI**
```bash
# List API keys
gcloud alpha services api-keys list --project=fast-food-manager-b1f54

# Delete the exposed key (get ID from list command)
gcloud alpha services api-keys delete [KEY_ID] --project=fast-food-manager-b1f54
```

### 2. Get New Credentials

**Web App:**
```
1. Go to: https://console.firebase.google.com/project/fast-food-manager-b1f54/settings/general
2. Scroll to "Your apps" → Web apps
3. Click on your web app OR click "Add app" to create new one
4. Copy the config object - you'll need it next
```

**Android App:**
```
1. Same page, find "Your apps" → Android section
2. Click on your Android app (com.fast.manger.food)
3. Download google-services.json
4. Save to: android/app/google-services.json
```

### 3. Configure Local Environment

```bash
# Frontend
cd frontend
cp .env.example .env
nano .env  # Paste your new Firebase config here

# Your new .env should look like:
# VITE_FIREBASE_API_KEY=AIza...YOUR_NEW_KEY
# VITE_FIREBASE_AUTH_DOMAIN=fast-food-manager-b1f54.firebaseapp.com
# etc.
```

---

## 🛡️ CRITICAL: Set API Restrictions (10 minutes)

### Restrict Your New Web API Key

```
1. Go to: https://console.cloud.google.com/apis/credentials?project=fast-food-manager-b1f54
2. Click on your NEW API key
3. Under "Application restrictions":
   → Select "HTTP referrers (web sites)"
   → Add:
      http://localhost:*/*
      https://yourdomain.com/*
      https://*.firebaseapp.com/*

4. Under "API restrictions":
   → Select "Restrict key"
   → Check ONLY these:
      ✓ Cloud Firestore API
      ✓ Identity Toolkit API
      ✓ Token Service API
      ✓ Firebase Installations API

5. Click SAVE
```

**Why?** Without restrictions, anyone can use your key from anywhere!

---

## 🔐 Rotate Service Account Key (5 minutes)

```bash
# 1. Generate new key
# Go to: https://console.firebase.google.com/project/fast-food-manager-b1f54/settings/serviceaccounts/adminsdk
# Click "Generate new private key" → Download

# 2. Replace old key
mv ~/Downloads/fast-food-manager-*.json ./serviceAccountKey.json

# 3. Delete old key in console
# Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=fast-food-manager-b1f54
# Click firebase-adminsdk → Keys tab → Delete old key
```

---

## ✅ Verify Setup (5 minutes)

### Test Frontend:
```bash
cd frontend
npm install
npm run dev

# Visit http://localhost:5173
# Try logging in - it should work!
```

### Test Backend:
```bash
cd backend
npm start

# Should see: "✅ Connected to Firebase"
```

### Test Android:
```bash
cd android
./gradlew build

# Should build successfully with no Firebase errors
```

---

## 📊 Monitor for Suspicious Activity

### Check Recent Usage:

```
1. Firebase Console → Usage and billing → Usage
2. Look for unusual spikes in:
   - Authentication attempts
   - Firestore reads/writes
   - Storage downloads

3. If you see suspicious activity:
   - Review Firestore data for unauthorized changes
   - Check Authentication users for unknown accounts
   - Consider resetting all user passwords
```

### Google Cloud Audit Logs:

```
1. https://console.cloud.google.com/logs/query?project=fast-food-manager-b1f54
2. Run this query:

resource.type="api"
protoPayload.authenticationInfo.principalEmail!~"@fast-food-manager-b1f54.iam.gserviceaccount.com$"
protoPayload.authenticationInfo.principalEmail!~"@appspot.gserviceaccount.com$"

3. Look for unfamiliar IP addresses or locations
```

---

## 🚀 Next Steps (After Immediate Actions)

After you've completed the urgent actions above:

1. **Read the comprehensive guide**: `SECURITY_BEST_PRACTICES.md`
2. **Set up Firebase Security Rules**: Deploy proper Firestore/Storage rules
3. **Enable App Check**: Add an extra layer of protection
4. **Set up billing alerts**: Prevent surprise costs from abuse
5. **Schedule security audit**: Review settings monthly

---

## 📞 Need Help?

- **Firebase Support**: https://firebase.google.com/support
- **Google Cloud Support**: https://cloud.google.com/support
- **Security Incident**: https://cloud.google.com/security/incident-response

---

## 🎯 Quick Reference: What Goes Where

| File | Location | Status | Contains |
|------|----------|--------|----------|
| `frontend/.env` | Local only | ✅ Gitignored | Web Firebase config |
| `android/app/google-services.json` | Local only | ✅ Gitignored | Android Firebase config |
| `serviceAccountKey.json` | Local only | ✅ Gitignored | Backend service account |
| `frontend/.env.example` | Git repo | ✅ Safe | Template only |
| `android/app/google-services.json.example` | Git repo | ✅ Safe | Template only |

**Remember**: NEVER commit files with real credentials!

---

## ⏱️ Time Estimate

- [ ] Delete exposed key: **2 min**
- [ ] Get new credentials: **3 min**
- [ ] Set up local .env: **2 min**
- [ ] Restrict new API key: **5 min**
- [ ] Rotate service account: **3 min**
- [ ] Test everything: **5 min**

**Total: ~20 minutes** to secure your application

---

**Status**: Your GitHub repository is now clean ✅
**Action Required**: Rotate the exposed credentials ⚠️
**Priority**: URGENT 🚨
