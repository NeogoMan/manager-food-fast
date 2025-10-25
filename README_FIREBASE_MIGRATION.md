# 🔥 Firebase Migration - Quick Start Guide

## What Has Been Done

I've successfully prepared your project for Firebase migration! Here's what's been set up:

### ✅ Completed

1. **Firebase Configuration**
   - `firebase.json` - Project configuration
   - `firestore.rules` - Security rules with role-based access
   - `firestore.indexes.json` - Database performance indexes
   - `frontend/src/config/firebase.js` - SDK configuration

2. **Cloud Functions** (`functions/`)
   - **Authentication**: Username/password login (NOT email!)
   - **User Management**: Create users, set roles, update status
   - **Order Triggers**: Automatic notifications on approval/completion
   - All with bcrypt password hashing

3. **Data Migration Script** (`firebase-migration/`)
   - Migrates users, menu items, and orders from PostgreSQL
   - Preserves all relationships and data integrity

4. **Frontend Auth** (`frontend/src/contexts/AuthContext.jsx`)
   - Migrated to Firebase Custom Token authentication
   - Maintains username/password login (no email required)
   - Same interface - no breaking changes!

5. **Firebase SDK**
   - Installed in frontend (`firebase@^12.4.0`)
   - Ready to use

---

## 🚀 What You Need to Do Now

### Step 1: Create Firebase Project (5 min)

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name: `fast-food-manager` (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Services (10 min)

In your Firebase project:

**2.1 Authentication**
- Go to: Build → Authentication
- Click "Get started"
- Leave it as is (we use custom tokens)

**2.2 Firestore Database**
- Go to: Build → Firestore Database
- Click "Create database"
- Mode: **Production mode**
- Location: **eur3 (europe-west)** or **eur1** (closest to Morocco)
- Click "Enable"

**2.3 Cloud Functions**
- Go to: Build → Functions
- Click "Get started"
- Upgrade to **Blaze (pay-as-you-go)** plan
  - Don't worry! FREE tier: 2M invocations/month
  - Your single restaurant will likely stay **FREE**
- Set up billing (no charge if under free tier)

**2.4 Hosting** (optional for now)
- Go to: Build → Hosting
- Click "Get started"

### Step 3: Get Your Firebase Config (2 min)

1. Click gear icon (⚙️) → Project settings
2. Scroll to "Your apps"
3. Click Web icon (`</>`)
4. Register app name: `Fast Food Manager`
5. Copy the `firebaseConfig` object

Example:
```javascript
{
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123..."
}
```

### Step 4: Update Configuration Files

**4.1 Update `.firebaserc`**
```json
{
  "projects": {
    "default": "your-actual-project-id"  ← PUT YOUR PROJECT ID HERE
  }
}
```

**4.2 Update `frontend/src/config/firebase.js`**
Replace placeholder values with your actual Firebase config from Step 3.

### Step 5: Install Dependencies & Deploy

```bash
# Install Cloud Functions dependencies
cd functions
npm install

# Go back to project root
cd ..

# Login to Firebase
firebase login

# Deploy Firestore security rules
firebase deploy --only firestore:rules,firestore:indexes

# Deploy Cloud Functions (takes 5-10 minutes first time)
firebase deploy --only functions
```

### Step 6: Migrate Your Data

**Option A: Full Migration (Recommended)**
```bash
cd firebase-migration
npm install

# Download service account key first!
# Firebase Console → Project Settings → Service Accounts
# → Generate New Private Key → Save as serviceAccountKey.json

node migrate.js
```

**Option B: Create Admin User Manually**

1. Go to Firebase Console → Firestore Database
2. Click "Start collection"
3. Collection ID: `users`
4. Add document with auto ID:
   ```javascript
   {
     username: "admin",
     passwordHash: "$2b$10$YourBcryptHashHere",  // Use bcrypt to hash "Admin123!"
     role: "manager",
     name: "Administrator",
     phone: null,
     status: "active",
     createdAt: (timestamp)
   }
   ```

### Step 7: Test Authentication

```bash
cd frontend
npm run dev
```

Login with:
- **Username**: `admin`
- **Password**: `Admin123!` (or whatever you set)

If login works, **authentication is complete!** ✅

---

## 📁 Project Structure

```
Fasr food project/
├── 📄 firebase.json                    ← Firebase config
├── 📄 .firebaserc                      ← Project ID (UPDATE THIS)
├── 📄 firestore.rules                  ← Security rules
├── 📄 firestore.indexes.json           ← Database indexes
│
├── 📁 functions/                       ← Cloud Functions
│   ├── index.js                        ← Auth + triggers
│   ├── package.json
│   └── .eslintrc.js
│
├── 📁 firebase-migration/              ← Data migration
│   ├── migrate.js                      ← Migration script
│   ├── package.json
│   └── serviceAccountKey.json          ← DOWNLOAD THIS!
│
└── 📁 frontend/
    └── src/
        ├── 📁 config/
        │   └── firebase.js             ← Firebase SDK (UPDATE THIS)
        └── 📁 contexts/
            └── AuthContext.jsx         ← ✅ Migrated!
```

---

## 🎯 What's Next (Future Work)

### Remaining Tasks

1. **Replace API calls with Firestore**
   - Menu management
   - Order management
   - User management
   - Dashboard

2. **Replace Socket.io with Firestore real-time listeners**
   - Kitchen screen
   - Orders screen
   - Notifications

3. **Testing**
   - All user roles
   - Real-time features
   - Security rules

4. **Deployment**
   - Firebase Hosting
   - Custom domain (optional)

I can help you with these once the Firebase setup is complete!

---

## 💰 Cost Estimate

### Firebase FREE Tier (Spark Plan)
- **Firestore**: 50k reads, 20k writes/day
- **Functions**: 2M invocations/month
- **Hosting**: 10GB storage, 10GB transfer/month

### Your Expected Usage (Single Restaurant)
- **Firestore**: ~6k reads, ~360 writes/day ✅
- **Functions**: ~5k invocations/month ✅
- **Hosting**: ~2GB transfer/month ✅

**Result**: **$0-1/month** (vs €3.79-14/month with VPS)

---

## 🔧 Troubleshooting

### "Command not found: firebase"
```bash
npm install -g firebase-tools
firebase login
```

### "Permission denied" in Firestore
```bash
firebase deploy --only firestore:rules
```

### Cloud Functions not working
1. Check deployed: `firebase functions:list`
2. Check logs: `firebase functions:log`
3. Redeploy: `firebase deploy --only functions`

### Frontend can't connect to Firebase
1. Verify `frontend/src/config/firebase.js` has correct values
2. Check browser console for errors
3. Verify project ID in `.firebaserc` matches Firebase Console

---

## 📚 Documentation

- `FIREBASE_SETUP.md` - Detailed setup instructions
- `FIREBASE_MIGRATION_PROGRESS.md` - Migration progress tracker
- `firebase-migration/README.md` - Data migration guide
- `FIREBASE_ALTERNATIVE_ANALYSIS.md` - Why Firebase?

---

## ✅ Quick Checklist

- [ ] Create Firebase project
- [ ] Enable Authentication
- [ ] Enable Firestore
- [ ] Enable Cloud Functions (upgrade to Blaze)
- [ ] Get Firebase config
- [ ] Update `.firebaserc` with project ID
- [ ] Update `frontend/src/config/firebase.js` with config
- [ ] Install functions dependencies: `cd functions && npm install`
- [ ] Deploy security rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Cloud Functions: `firebase deploy --only functions`
- [ ] Migrate data OR create admin user manually
- [ ] Test login with username/password

---

## 🆘 Need Help?

If you get stuck:
1. Check Firebase Console for error messages
2. Check browser console
3. Check function logs: `firebase functions:log`
4. Review documentation files
5. Ask me for help!

---

## 🎉 Ready?

Once you complete the steps above:
1. Test that login works
2. Let me know
3. I'll continue migrating the frontend components!

**Good luck! You're almost there! 🚀**
