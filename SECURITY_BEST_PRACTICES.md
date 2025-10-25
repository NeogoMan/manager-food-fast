# Security Best Practices Guide

## Immediate Actions Required

### Step 1: Delete Exposed API Key (URGENT)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project: `fast-food-manager-b1f54`

2. **Navigate to Credentials**
   - Click hamburger menu (☰) → APIs & Services → Credentials
   - Find the exposed API key: `AIzaSyA0cAK5_UDPIt37-9q-jSFixTNfiOlFtLk`

3. **Delete the Key**
   - Click the trash icon next to the key
   - Confirm deletion
   - ⚠️ This will break your current apps until you configure new credentials

### Step 2: Generate New API Key

#### For Web App (Frontend):

1. **Firebase Console**
   ```
   https://console.firebase.google.com/
   → Select your project
   → Project Settings (⚙️)
   → General tab
   → Scroll to "Your apps" → Web apps section
   ```

2. **Option A: Use Existing Web App**
   - Click on your existing web app
   - Copy the config object
   - The `apiKey` is your new web API key

3. **Option B: Create New Web App**
   - Click "Add app" → Web (</> icon)
   - Register app with a nickname (e.g., "Fast Food Manager Web")
   - Copy the entire Firebase config
   - Save it securely (we'll use it next)

#### For Android App:

1. **Firebase Console**
   ```
   https://console.firebase.google.com/
   → Select your project
   → Project Settings (⚙️)
   → General tab
   → Your apps → Android section
   ```

2. **Download New google-services.json**
   - Click on your Android app (package: `com.fast.manger.food`)
   - Scroll down and click "google-services.json"
   - Save to `android/app/google-services.json`

---

## Step 3: Configure API Key Restrictions (CRITICAL)

### Web API Key Restrictions:

1. **Go to Google Cloud Console → Credentials**
   - Find your new web API key
   - Click on it to edit

2. **Set Application Restrictions**
   ```
   Application restrictions:
   ○ None (NOT recommended)
   ● HTTP referrers (web sites)

   Website restrictions:
   Add these referrers:
   - http://localhost:3000/*      (development)
   - http://localhost:5173/*      (Vite dev server)
   - https://yourdomain.com/*     (production - replace with your actual domain)
   - https://*.firebaseapp.com/*  (Firebase Hosting)
   ```

3. **Set API Restrictions**
   ```
   API restrictions:
   ● Restrict key

   Select these APIs only:
   ✓ Cloud Firestore API
   ✓ Firebase Authentication API
   ✓ Cloud Functions API
   ✓ Firebase Storage API
   ✓ Cloud Messaging API (if using FCM)
   ✓ Identity Toolkit API
   ```

4. **Save Changes**

### Android API Key Restrictions:

1. **Get Your App's SHA-1 Fingerprint**
   ```bash
   cd android
   ./gradlew signingReport
   ```
   Copy the SHA-1 fingerprint from the output

2. **Add to Firebase**
   ```
   Firebase Console → Project Settings → General
   → Your apps → Android app
   → Add fingerprint
   → Paste SHA-1
   ```

3. **Restrict in Google Cloud Console**
   ```
   Application restrictions:
   ● Android apps

   Add package name and SHA-1:
   Package name: com.fast.manger.food
   SHA-1: [your SHA-1 from step 1]
   ```

---

## Step 4: Set Up Local Environment Files

### Frontend Configuration:

```bash
# Navigate to frontend directory
cd frontend

# Create .env file from example
cp .env.example .env

# Edit .env with your new credentials
nano .env  # or use your preferred editor
```

**frontend/.env** (use your actual values):
```env
# WebSocket/API Server URL
VITE_SOCKET_URL=http://localhost:3000

# Firebase Configuration (REPLACE WITH YOUR NEW VALUES)
VITE_FIREBASE_API_KEY=AIza...YOUR_NEW_KEY_HERE
VITE_FIREBASE_AUTH_DOMAIN=fast-food-manager-b1f54.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fast-food-manager-b1f54
VITE_FIREBASE_STORAGE_BUCKET=fast-food-manager-b1f54.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=878238967433
VITE_FIREBASE_APP_ID=1:878238967433:web:YOUR_NEW_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=G-YOUR_MEASUREMENT_ID

# Firebase Emulators (for development)
VITE_USE_FIREBASE_EMULATORS=false
```

### Backend Configuration:

```bash
cd backend
cp .env.example .env
nano .env
```

**backend/.env**:
```env
NODE_ENV=development
PORT=3000

# Database (if still using PostgreSQL/SQLite)
DB_TYPE=postgres
# ... other DB settings

# Firebase Admin SDK uses serviceAccountKey.json
# No need to put credentials in .env
```

---

## Step 5: Rotate Service Account Key

The `serviceAccountKey.json` was also exposed. Rotate it:

1. **Firebase Console**
   ```
   → Project Settings → Service Accounts
   → Firebase Admin SDK
   → Manage service account permissions
   ```

2. **Google Cloud Console**
   ```
   → IAM & Admin → Service Accounts
   → Click on "firebase-adminsdk-..." email
   → Keys tab
   → Add Key → Create new key → JSON
   → Download and save as serviceAccountKey.json
   ```

3. **Delete Old Key**
   ```
   → Find the old key in the list
   → Delete it (⋮ menu → Delete)
   ```

4. **Place New Key**
   ```bash
   # Move downloaded key to project root
   mv ~/Downloads/your-project-xxxxx.json ./serviceAccountKey.json
   ```

---

## Step 6: Configure Firebase Security Rules

### Firestore Rules (firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || isOwner(userId);
    }

    // Menu items - read by all authenticated users, write by admins
    match /menuItems/{itemId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Orders - users can read their own, admins can read all
    match /orders/{orderId} {
      allow read: if isAuthenticated() &&
                     (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // FCM tokens
    match /fcmTokens/{tokenId} {
      allow read, write: if isAuthenticated() &&
                           (tokenId == request.auth.uid || isAdmin());
    }
  }
}
```

**Deploy rules:**
```bash
firebase deploy --only firestore:rules
```

### Storage Rules (storage.rules):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return request.auth.token.role == 'admin';
    }

    // Menu item images
    match /menu-items/{itemId}/{allPaths=**} {
      allow read: if true;  // Public read for menu images
      allow write: if isAdmin();
    }

    // User uploads
    match /users/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if request.auth.uid == userId || isAdmin();
    }
  }
}
```

---

## Step 7: Set Up Firebase App Check (Advanced Protection)

App Check protects your Firebase resources from abuse by verifying requests come from your app.

### For Web:

1. **Enable App Check in Firebase Console**
   ```
   → Build → App Check
   → Register your web app
   → Choose reCAPTCHA v3 or reCAPTCHA Enterprise
   ```

2. **Add to Frontend** (frontend/src/config/firebase.js):
   ```javascript
   import { initializeApp } from 'firebase/app';
   import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

   const app = initializeApp(firebaseConfig);

   // Initialize App Check
   if (import.meta.env.PROD) {
     const appCheck = initializeAppCheck(app, {
       provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
       isTokenAutoRefreshEnabled: true
     });
   }
   ```

### For Android:

1. **Enable Play Integrity in Firebase Console**
   ```
   → Build → App Check
   → Register your Android app
   → Choose Play Integrity
   ```

2. **Add to Android** (android/app/build.gradle.kts):
   ```kotlin
   dependencies {
       implementation("com.google.firebase:firebase-appcheck-playintegrity:18.0.0")
   }
   ```

3. **Initialize** (android/app/src/main/java/com/fast/manger/food/FastFoodApp.kt):
   ```kotlin
   import com.google.firebase.appcheck.FirebaseAppCheck
   import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory

   class FastFoodApp : Application() {
       override fun onCreate() {
           super.onCreate()

           val firebaseAppCheck = FirebaseAppCheck.getInstance()
           firebaseAppCheck.installAppCheckProviderFactory(
               PlayIntegrityAppCheckProviderFactory.getInstance()
           )
       }
   }
   ```

---

## Step 8: Enable Security Monitoring

### Firebase Console Alerts:

1. **Go to Firebase Console → Project Settings**
2. **Integrations tab → Cloud Monitoring**
3. **Set up alerts for:**
   - Unusual authentication attempts
   - High read/write rates to Firestore
   - Failed security rule violations

### Google Cloud Security Command Center:

```
Google Cloud Console → Security → Security Command Center
→ Enable (may require billing)
→ Configure findings notifications
```

---

## Step 9: Additional Security Measures

### 1. Enable Audit Logging

```
Google Cloud Console → IAM & Admin → Audit Logs
→ Enable Admin Read, Data Read, Data Write for:
  - Cloud Firestore API
  - Firebase Authentication API
```

### 2. Set Up Billing Alerts

```
Google Cloud Console → Billing → Budgets & alerts
→ Create budget
→ Set threshold alerts (e.g., 50%, 90%, 100%)
```

This protects against abuse that could rack up costs.

### 3. Regular Security Audits

Create a monthly checklist:
- [ ] Review IAM permissions
- [ ] Check for unused service accounts/keys
- [ ] Review Firestore security rules
- [ ] Check API usage patterns
- [ ] Rotate service account keys (every 90 days)
- [ ] Review App Check metrics
- [ ] Check for security vulnerabilities in dependencies

### 4. Use Secret Management

For production, consider:
- **Google Secret Manager**
- **HashiCorp Vault**
- **AWS Secrets Manager** (if on AWS)

---

## Step 10: Verify Everything Works

### Test Frontend:
```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173 and verify:
- ✓ Firebase connection works
- ✓ Authentication works
- ✓ Firestore reads/writes work
- ✓ No console errors about missing credentials

### Test Backend:
```bash
cd backend
npm install
npm start
```

Verify:
- ✓ Server starts without errors
- ✓ Firebase Admin SDK initializes
- ✓ Can perform admin operations

### Test Android:
```bash
cd android
./gradlew build
./gradlew installDebug
```

Verify:
- ✓ App builds successfully
- ✓ Firebase connection works
- ✓ Authentication and Firestore work

---

## Emergency Response Plan

If you discover another credential leak:

1. **Immediately**:
   - Revoke/delete the exposed credential
   - Generate new credentials
   - Force push cleaned Git history

2. **Within 24 hours**:
   - Review all access logs for suspicious activity
   - Rotate all related credentials
   - Update all deployments with new credentials

3. **Within 1 week**:
   - Audit all security rules
   - Review IAM permissions
   - Set up additional monitoring

---

## Summary Checklist

- [ ] Delete exposed API key `AIzaSyA0cAK5_UDPIt37-9q-jSFixTNfiOlFtLk`
- [ ] Generate new web API key
- [ ] Download new `google-services.json` for Android
- [ ] Set up API key restrictions (HTTP referrers + API limits)
- [ ] Create `frontend/.env` with new credentials
- [ ] Rotate `serviceAccountKey.json`
- [ ] Deploy Firestore security rules
- [ ] Deploy Storage security rules
- [ ] Enable App Check for web and Android
- [ ] Set up billing alerts
- [ ] Enable audit logging
- [ ] Test all applications (web, backend, Android)
- [ ] Set up security monitoring
- [ ] Schedule regular security audits

---

## Resources

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Firebase Security Checklist](https://firebase.google.com/support/guides/security-checklist)
- [Google Cloud Security](https://cloud.google.com/security)

---

**Remember**: Security is an ongoing process, not a one-time setup!
