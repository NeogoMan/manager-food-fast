# Deployment Guide - Production Deployment

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Firebase Project Setup](#firebase-project-setup)
- [Environment Configuration](#environment-configuration)
- [Building the Application](#building-the-application)
- [Deploying to Firebase](#deploying-to-firebase)
- [Post-Deployment Tasks](#post-deployment-tasks)
- [Continuous Deployment](#continuous-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Overview

This guide covers deploying the Fast Food Restaurant Management System to Firebase production environment.

**Deployment Stack**:
- **Frontend**: Firebase Hosting (React SPA)
- **Backend**: Firebase Cloud Functions (Node.js)
- **Database**: Cloud Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Cloud Storage

**Deployment Time**: ~10-15 minutes

---

## Prerequisites

### Required Tools

1. **Node.js**
   - Version: 18.x or 20.x
   - Download: https://nodejs.org/

2. **npm**
   - Comes with Node.js
   - Minimum version: 9.x

3. **Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

4. **Git**
   - For version control
   - Download: https://git-scm.com/

### Required Accounts

1. **Firebase/Google Cloud Account**
   - Sign up at https://console.firebase.google.com/
   - Enable billing (required for Cloud Functions)

2. **GitHub Account** (optional, for CI/CD)
   - For automated deployments

---

## Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Enter project name: `fast-food-manager-prod`
4. **Disable Google Analytics** (optional)
5. Click **Create project**

### 2. Upgrade to Blaze Plan

Cloud Functions require the Blaze (pay-as-you-go) plan.

1. Go to **Project Settings** → **Usage and billing**
2. Click **Modify plan**
3. Select **Blaze plan**
4. Add payment method

### 3. Enable Services

**Firestore**:
1. Go to **Firestore Database**
2. Click **Create database**
3. Select **Production mode**
4. Choose location (e.g., `us-central`)
5. Click **Enable**

**Authentication**:
1. Go to **Authentication**
2. Click **Get started**
3. Enable **Email/Password** provider (even though we use custom tokens)

**Cloud Functions**:
- Automatically enabled when deploying

**Hosting**:
- Automatically enabled when deploying

**Storage** (optional):
1. Go to **Storage**
2. Click **Get started**
3. Use default security rules
4. Choose location

### 4. Create Web App

1. Go to **Project Settings**
2. Scroll to **Your apps**
3. Click **Web** icon (</>)
4. Register app name: `Fast Food Manager`
5. Check **Firebase Hosting** checkbox
6. Click **Register app**
7. **Copy Firebase config object** (you'll need this)

Example config:
```javascript
{
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "fast-food-manager-prod.firebaseapp.com",
  projectId: "fast-food-manager-prod",
  storageBucket: "fast-food-manager-prod.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
}
```

---

## Environment Configuration

### 1. Frontend Configuration

**File**: `frontend/src/config/firebase.js`

Replace with your Firebase config:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const messaging = getMessaging(app);
```

### 2. Firebase CLI Login

```bash
firebase login
```

This opens a browser window to authenticate with Google.

### 3. Initialize Firebase in Project

```bash
cd /Users/elmehdimotaqi/Documents/Fasr\ food\ project
firebase init
```

**Select features**:
- ✅ Firestore
- ✅ Functions
- ✅ Hosting

**Configuration**:
- **Firestore rules**: `firestore.rules`
- **Firestore indexes**: `firestore.indexes.json`
- **Functions language**: JavaScript
- **ESLint**: Yes
- **Functions directory**: `functions`
- **Hosting directory**: `frontend/dist`
- **Configure as SPA**: Yes
- **GitHub Actions**: No (optional)

### 4. Set Firebase Project

```bash
firebase use --add
```

Select your project, give it an alias (e.g., `production`).

**File Created**: `.firebaserc`
```json
{
  "projects": {
    "production": "fast-food-manager-prod"
  }
}
```

---

## Building the Application

### 1. Install Dependencies

**Root dependencies**:
```bash
npm install
```

**Frontend dependencies**:
```bash
cd frontend
npm install
cd ..
```

**Functions dependencies**:
```bash
cd functions
npm install
cd ..
```

### 2. Build Frontend

```bash
cd frontend
npm run build
```

**Output**: `frontend/dist/` directory containing optimized production build.

**Build Process**:
- Vite bundles React app
- Minifies JavaScript
- Optimizes CSS
- Generates source maps
- Creates index.html with asset references

**Verify Build**:
```bash
ls -la frontend/dist
```

Expected output:
```
drwxr-xr-x  index.html
drwxr-xr-x  assets/
  - index-abc123.js
  - index-abc123.css
  - logo-xyz789.png
```

### 3. Lint Functions

```bash
cd functions
npm run lint
```

Fix any linting errors before deploying.

---

## Deploying to Firebase

### Full Deployment

Deploy everything (Firestore rules, Functions, Hosting):

```bash
firebase deploy
```

**Deployment Steps**:
1. Upload Firestore security rules
2. Upload Firestore indexes
3. Build and upload Cloud Functions
4. Upload frontend build to Hosting
5. Configure CDN and SSL

**Expected Output**:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/fast-food-manager-prod/overview
Hosting URL: https://fast-food-manager-prod.web.app
```

### Partial Deployments

**Deploy only Firestore rules**:
```bash
firebase deploy --only firestore:rules
```

**Deploy only Functions**:
```bash
firebase deploy --only functions
```

**Deploy specific function**:
```bash
firebase deploy --only functions:authenticateUser
```

**Deploy only Hosting**:
```bash
firebase deploy --only hosting
```

### Deployment with Message

```bash
firebase deploy -m "Added new order management features"
```

---

## Post-Deployment Tasks

### 1. Create Super Admin Account

**Run Script**:
```bash
cd scripts
node create-superadmin.cjs
```

**Or Manual Creation**:

1. Go to Firestore Console
2. Create `super_admins` collection
3. Add document with auto-generated ID:

```javascript
{
  username: "admin",
  passwordHash: "<BCRYPT_HASH>",  // Use bcrypt to hash password
  name: "Platform Admin",
  phone: "+1234567890",
  status: "active",
  createdAt: <CURRENT_TIMESTAMP>,
  updatedAt: <CURRENT_TIMESTAMP>,
  loginAttempts: 0,
  lastLoginAt: null
}
```

**Generate password hash** (Node.js):
```javascript
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash('YourSecurePassword123!', 10);
console.log(hash);
```

### 2. Verify Firestore Indexes

1. Go to Firestore Console → **Indexes**
2. Wait for all indexes to build (may take a few minutes)
3. Status should be **Enabled** (green checkmark)

**Common Indexes**:
- `orders`: `restaurantId`, `status`, `createdAt` (DESC)
- `orders`: `restaurantId`, `orderNumber` (ASC)
- `menu`: `restaurantId`, `isAvailable` (ASC)
- `users`: `restaurantId`, `username` (ASC)

### 3. Test Super Admin Login

1. Open Hosting URL: `https://fast-food-manager-prod.web.app`
2. Navigate to `/admin/login`
3. Login with super admin credentials
4. Verify access to admin dashboard

### 4. Create Test Restaurant

1. Go to **Restaurants** page
2. Click **Create Restaurant**
3. Fill in details:
   - Name: Test Restaurant
   - Email: test@example.com
   - Plan: Basic
   - Admin user credentials
4. Click **Create**
5. Note the restaurant code (e.g., `REST001`)

### 5. Verify Restaurant Login

1. Navigate to `/login`
2. Login with restaurant admin credentials
3. Verify access to staff dashboard

### 6. Test Guest Ordering

1. Generate QR code for test restaurant
2. Scan QR code with mobile device
3. Complete guest ordering flow
4. Verify order appears in Orders page

### 7. Configure Custom Domain (Optional)

**Prerequisites**:
- Own a domain (e.g., `fastfood.example.com`)
- Access to DNS settings

**Steps**:
1. Go to Firebase Console → **Hosting**
2. Click **Add custom domain**
3. Enter domain name
4. Follow verification steps
5. Add DNS records to your domain provider
6. Wait for DNS propagation (up to 48 hours)
7. Firebase auto-provisions SSL certificate

---

## Continuous Deployment

### Option 1: GitHub Actions

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm install
          cd frontend && npm install
          cd ../functions && npm install

      - name: Build frontend
        run: cd frontend && npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: fast-food-manager-prod
```

**Setup**:
1. Go to Firebase Console → **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download JSON file
4. Go to GitHub repository → **Settings** → **Secrets**
5. Add secret: `FIREBASE_SERVICE_ACCOUNT` with JSON content

### Option 2: Manual Deployment Script

**File**: `deploy.sh`

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Install functions dependencies
echo "📦 Installing functions dependencies..."
cd functions
npm install
cd ..

# Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy -m "Deploy $(date +%Y-%m-%d\ %H:%M:%S)"

echo "✅ Deployment complete!"
```

**Usage**:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Monitoring & Maintenance

### 1. Cloud Functions Logs

**View all logs**:
```bash
firebase functions:log
```

**View specific function**:
```bash
firebase functions:log --only authenticateUser
```

**View errors only**:
```bash
firebase functions:log --only authenticateUser | grep ERROR
```

**View in Console**:
1. Go to Firebase Console → **Functions**
2. Click function name
3. Go to **Logs** tab

### 2. Firestore Usage

**Monitor**:
1. Go to Firebase Console → **Firestore Database** → **Usage**
2. View:
   - Document reads/writes
   - Storage used
   - Network bandwidth

**Set Budget Alerts**:
1. Go to Google Cloud Console
2. **Billing** → **Budgets & alerts**
3. Create budget with email notifications

### 3. Hosting Analytics

**View**:
1. Go to Firebase Console → **Hosting**
2. View:
   - Request count
   - Bandwidth usage
   - CDN cache hit rate

### 4. Error Monitoring

**Crashlytics** (for Android app):
1. Firebase Console → **Crashlytics**
2. View crash reports

**Custom Error Tracking** (for web):
- Integrate Sentry or similar service
- Or use Cloud Functions to log errors to Firestore

### 5. Performance Monitoring

**Web Performance**:
1. Firebase Console → **Performance**
2. Add Firebase Performance SDK to frontend
3. Track page load times, API calls

### 6. Security Rules Audit

**Review regularly**:
```bash
firebase firestore:rules:get > firestore.rules.backup
```

**Test rules locally**:
```bash
firebase emulators:start
```

### 7. Backup Firestore Data

**Export to Cloud Storage**:
```bash
gcloud firestore export gs://YOUR_BUCKET_NAME/backups/$(date +%Y%m%d)
```

**Schedule automated backups** via Cloud Scheduler.

---

## Troubleshooting

### Issue: Functions Deployment Fails

**Error**: `Billing account not configured`

**Solution**:
```bash
# Link Firebase project to Cloud billing account
gcloud alpha billing projects link fast-food-manager-prod \
  --billing-account=ABCDEF-123456-GHIJKL
```

---

### Issue: Hosting Shows 404

**Symptoms**: All routes return 404 except home page

**Solution**:
Check `firebase.json` has SPA rewrite rule:
```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

### Issue: CORS Errors

**Error**: `Access-Control-Allow-Origin` header missing

**Solution**:
Cloud Functions automatically handle CORS for `onCall` functions. If using `onRequest`:

```javascript
import cors from 'cors';
const corsHandler = cors({ origin: true });

export const myFunction = onRequest((req, res) => {
  corsHandler(req, res, () => {
    // Function logic
  });
});
```

---

### Issue: Firestore Permission Denied

**Error**: `Missing or insufficient permissions`

**Solution**:
1. Check Firestore security rules
2. Ensure user has correct custom claims
3. Verify `restaurantId` in token matches document

**Debug**:
```javascript
// frontend
const idToken = await auth.currentUser.getIdTokenResult();
console.log('Token claims:', idToken.claims);
```

---

### Issue: Functions Running Out of Memory

**Error**: `Function execution took too long`

**Solution**:
Increase memory allocation in `functions/index.js`:

```javascript
import { onCall } from 'firebase-functions/v2/https';

export const myFunction = onCall({
  memory: '512MiB',  // Default is 256MiB
  timeoutSeconds: 300  // Default is 60
}, async (request) => {
  // Function logic
});
```

---

### Issue: Build Fails on Vite

**Error**: `Cannot resolve module`

**Solution**:
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Production Checklist

Before going live, verify:

### Security
- [ ] Firebase security rules reviewed and tested
- [ ] Super admin password is strong (12+ characters)
- [ ] All API keys are in environment variables
- [ ] HTTPS enforced (Firebase does this automatically)
- [ ] Rate limiting enabled on sensitive functions
- [ ] Guest orders require staff approval

### Functionality
- [ ] Super admin login works
- [ ] Restaurant login works
- [ ] Order creation works
- [ ] Kitchen display updates in real-time
- [ ] Guest ordering works
- [ ] QR code scanning works
- [ ] Push notifications work (if enabled)

### Performance
- [ ] Frontend build is optimized (check bundle size)
- [ ] Images are compressed
- [ ] Firestore indexes created
- [ ] Functions have adequate memory
- [ ] CDN is enabled for hosting

### Monitoring
- [ ] Firestore usage dashboard reviewed
- [ ] Functions logs accessible
- [ ] Error alerts configured
- [ ] Budget alerts set

### Backup
- [ ] Firestore backup strategy in place
- [ ] Super admin credentials stored securely
- [ ] Firebase config backed up

---

## Rollback Procedure

If deployment causes issues:

### 1. Rollback Hosting

```bash
firebase hosting:rollback
```

### 2. Rollback Functions

Redeploy previous version:
```bash
git checkout <previous-commit>
firebase deploy --only functions
```

### 3. Rollback Firestore Rules

```bash
# Restore from backup
firebase deploy --only firestore:rules
```

---

## Related Documentation

- [Technical Overview](./TECHNICAL_OVERVIEW.md) - System architecture
- [Development Guide](./DEVELOPMENT_GUIDE.md) - Local development setup
- [API Reference](./API_REFERENCE.md) - Cloud Functions documentation
- [Database Schema](./DATABASE_SCHEMA.md) - Firestore structure
