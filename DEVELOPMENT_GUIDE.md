# Development Guide - Getting Started

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Running Locally](#running-locally)
- [Development Workflow](#development-workflow)
- [Code Style & Guidelines](#code-style--guidelines)
- [Testing](#testing)
- [Adding New Features](#adding-new-features)
- [Common Development Tasks](#common-development-tasks)
- [Troubleshooting](#troubleshooting)

## Overview

This guide helps developers set up the development environment and start contributing to the Fast Food Restaurant Management System.

**Tech Stack**:
- **Frontend**: React 18 + Vite 5 + Tailwind CSS
- **Backend**: Firebase Cloud Functions (Node.js 20)
- **Database**: Cloud Firestore
- **Package Manager**: npm

**Development Time**: ~15 minutes to set up

---

## Prerequisites

### Required Software

1. **Node.js**
   - Version: 18.x or 20.x (LTS recommended)
   - Download: https://nodejs.org/
   - Verify installation:
     ```bash
     node --version  # Should be v18.x or v20.x
     npm --version   # Should be v9.x or higher
     ```

2. **Git**
   - Download: https://git-scm.com/
   - Verify installation:
     ```bash
     git --version  # Should be v2.x or higher
     ```

3. **Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase --version  # Should be v12.x or higher
     ```

4. **Code Editor** (recommended)
   - **VS Code**: https://code.visualstudio.com/
   - Extensions:
     - ESLint
     - Prettier - Code formatter
     - Tailwind CSS IntelliSense
     - Firebase (optional)

### Required Accounts

1. **Firebase Account**
   - Sign up at https://console.firebase.google.com/
   - Create a test project for development

2. **GitHub Account** (optional)
   - For contributing via pull requests

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/fast-food-manager.git
cd fast-food-manager
```

Or if you have access to the local project:
```bash
cd "/Users/elmehdimotaqi/Documents/Fasr food project"
```

### 2. Install Dependencies

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

**Verify installations**:
```bash
npm list --depth=0
```

### 3. Firebase Project Setup

**Create Development Project**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Name: `fast-food-dev`
4. Disable Google Analytics (not needed for dev)
5. Click **Create project**

**Enable Firestore**:
1. Go to **Firestore Database**
2. Click **Create database**
3. Select **Test mode** (for development)
4. Choose location: `us-central` or closest to you
5. Click **Enable**

**Enable Authentication**:
1. Go to **Authentication**
2. Click **Get started**
3. Enable **Email/Password** (even though we use custom tokens)

**Create Web App**:
1. Go to **Project Settings** → **General**
2. Scroll to **Your apps**
3. Click **Web** (</>)
4. Register app: `Fast Food Manager Dev`
5. Copy the Firebase config

### 4. Configure Firebase

**Login to Firebase CLI**:
```bash
firebase login
```

**Initialize Firebase** (if not already done):
```bash
firebase init
```

Select:
- ✅ Firestore
- ✅ Functions
- ✅ Hosting (optional for local dev)

**Set Project Alias**:
```bash
firebase use --add
```
- Select your dev project
- Alias: `dev`

**File Created**: `.firebaserc`
```json
{
  "projects": {
    "dev": "fast-food-dev"
  }
}
```

### 5. Configure Frontend

**File**: `frontend/src/config/firebase.js`

Replace with your dev Firebase config:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "YOUR_DEV_API_KEY",
  authDomain: "fast-food-dev.firebaseapp.com",
  projectId: "fast-food-dev",
  storageBucket: "fast-food-dev.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// DEVELOPMENT: Use emulators (optional)
if (window.location.hostname === 'localhost') {
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

### 6. Deploy Firestore Rules (Development)

**File**: `firestore.rules`

For development, use permissive rules (NEVER in production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // DEVELOPMENT ONLY - Allow all reads/writes
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Deploy:
```bash
firebase deploy --only firestore:rules
```

### 7. Create Super Admin Account

**Run Script**:
```bash
cd scripts
node create-superadmin.cjs
```

**Follow prompts**:
- Username: `admin`
- Password: `DevPass123!`
- Name: `Dev Admin`
- Phone: `+1234567890`

### 8. Seed Test Data (Optional)

Create a test restaurant and users:

**Run Script**:
```bash
node scripts/seed-test-data.cjs
```

This creates:
- Test restaurant with code `TEST01`
- Manager user: `manager_test` / `Manager123`
- Cashier user: `cashier_test` / `Cashier123`
- Cook user: `cook_test` / `Cook123`
- Sample menu items
- Sample orders

---

## Running Locally

### Option 1: Run Everything Together

```bash
# From project root
npm run dev
```

This runs:
- Frontend dev server (Vite) on `http://localhost:5173`
- Functions emulator on `http://localhost:5001` (if emulators enabled)

### Option 2: Run Separately

**Terminal 1 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 2 - Functions Emulator** (optional):
```bash
firebase emulators:start --only functions
```

**Terminal 3 - Firestore Emulator** (optional):
```bash
firebase emulators:start --only firestore
```

### Access the Application

**Frontend**: http://localhost:5173

**Routes**:
- `/login` - Restaurant user login
- `/admin/login` - Super admin login
- `/guest/TEST01` - Guest ordering (if TEST01 restaurant exists)

**Default Credentials** (after seed script):
- **Super Admin**: `admin` / `DevPass123!`
- **Manager**: `manager_test` / `Manager123`
- **Cashier**: `cashier_test` / `Cashier123`

---

## Development Workflow

### Daily Workflow

1. **Pull Latest Changes**:
   ```bash
   git pull origin main
   ```

2. **Install New Dependencies** (if package.json changed):
   ```bash
   npm install
   cd frontend && npm install && cd ..
   cd functions && npm install && cd ..
   ```

3. **Start Dev Server**:
   ```bash
   npm run dev
   ```

4. **Make Changes**:
   - Edit files in `frontend/src/` or `functions/`
   - Hot reload will apply changes instantly

5. **Test Changes**:
   - Test in browser
   - Check console for errors
   - Test across different roles

6. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat: Add new order status filter"
   git push origin feature/order-status-filter
   ```

### Git Workflow

**Branch Naming**:
- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `refactor/component-name` - Code refactoring
- `docs/section-name` - Documentation updates

**Commit Message Format**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation
- `style`: Code style (formatting)
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples**:
```bash
git commit -m "feat(orders): Add status filter dropdown"
git commit -m "fix(kitchen): Fix drag and drop not updating status"
git commit -m "refactor(auth): Extract login logic to custom hook"
```

---

## Code Style & Guidelines

### JavaScript/React

**Follow ESLint Rules**:
```bash
# Check for linting errors
npm run lint

# Auto-fix linting issues
npm run lint --fix
```

**Code Style**:
```javascript
// ✅ Good: Destructure props
function OrderCard({ order, onStatusChange }) {
  const { id, orderNumber, status, items } = order;

  return <div>...</div>;
}

// ❌ Bad: Using props directly
function OrderCard(props) {
  return <div>{props.order.orderNumber}</div>;
}
```

**Component Structure**:
```javascript
import { useState, useEffect } from 'react';
import styles from './OrderCard.module.css';

function OrderCard({ order }) {
  // 1. State declarations
  const [isExpanded, setIsExpanded] = useState(false);

  // 2. Effects
  useEffect(() => {
    // Side effects
  }, []);

  // 3. Event handlers
  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 4. Render
  return (
    <div className={styles.card}>
      {/* JSX */}
    </div>
  );
}

export default OrderCard;
```

**Naming Conventions**:
- **Components**: PascalCase (`OrderCard.jsx`)
- **Functions**: camelCase (`handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **CSS Modules**: camelCase (`styles.orderCard`)

### Firestore

**Collection Naming**: lowercase, plural
- `orders`, `users`, `restaurants`

**Document Naming**: Use auto-generated IDs or meaningful IDs
- Auto-generated: `doc(collection(db, 'orders'))`
- Meaningful: `doc(db, 'users', userId)`

**Field Naming**: camelCase
- `restaurantId`, `createdAt`, `orderNumber`

**Query Best Practices**:
```javascript
// ✅ Good: Use indexes
const q = query(
  collection(db, 'orders'),
  where('restaurantId', '==', restaurantId),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc'),
  limit(20)
);

// ❌ Bad: Missing filters
const q = query(collection(db, 'orders'));
```

### Cloud Functions

**Function Naming**: camelCase
- `authenticateUser`, `createRestaurant`

**Error Handling**:
```javascript
// ✅ Good: Proper error handling
export const myFunction = onCall(async (request) => {
  try {
    // Validation
    if (!request.data.param) {
      throw new HttpsError('invalid-argument', 'Param required');
    }

    // Logic
    const result = await someOperation();

    return { success: true, result };
  } catch (error) {
    console.error('Function error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Operation failed');
  }
});
```

---

## Testing

### Manual Testing

**Test Checklist**:
- [ ] Login as super admin
- [ ] Login as manager
- [ ] Login as cashier
- [ ] Login as cook
- [ ] Create new order
- [ ] Update order status
- [ ] Edit order
- [ ] Guest ordering flow
- [ ] Order tracking
- [ ] QR code generation

### Browser Testing

**Supported Browsers**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Mobile Testing**:
- iOS Safari
- Android Chrome

### Firebase Emulators

**Start All Emulators**:
```bash
firebase emulators:start
```

**Access Emulator UI**:
- **Emulator Suite UI**: http://localhost:4000
- **Firestore**: http://localhost:4000/firestore
- **Authentication**: http://localhost:4000/auth
- **Functions**: http://localhost:4000/functions

**Benefits**:
- Test without affecting production
- Fast iteration (no deployment)
- Offline development
- Deterministic testing

**Example**: Testing Cloud Function Locally
```bash
# Terminal 1: Start emulators
firebase emulators:start

# Terminal 2: Run frontend
cd frontend && npm run dev

# Configure frontend to use emulators (see firebase.js)
```

---

## Adding New Features

### Adding a New Page

1. **Create Component**:
   ```bash
   touch frontend/src/pages/NewFeature.jsx
   ```

2. **Write Component**:
   ```javascript
   import { useState } from 'react';
   import { useAuth } from '../contexts/AuthContext';

   export default function NewFeature() {
     const { user } = useAuth();
     const [data, setData] = useState([]);

     return (
       <div>
         <h1>New Feature</h1>
         {/* Content */}
       </div>
     );
   }
   ```

3. **Add Route** (`App.jsx`):
   ```javascript
   import NewFeature from './pages/NewFeature';

   <Route path="/new-feature" element={
     <ProtectedRoute allowedRoles={['manager']}>
       <StaffLayout><NewFeature /></StaffLayout>
     </ProtectedRoute>
   } />
   ```

4. **Add to Sidebar** (`Sidebar.jsx`):
   ```javascript
   {user.role === 'manager' && (
     <SidebarLink to="/new-feature" icon={<Icon />}>
       New Feature
     </SidebarLink>
   )}
   ```

### Adding a New Cloud Function

1. **Edit Functions** (`functions/index.js`):
   ```javascript
   export const myNewFunction = onCall(async (request) => {
     // Validation
     if (!request.auth) {
       throw new HttpsError('unauthenticated', 'Login required');
     }

     // Logic
     const result = await performOperation(request.data);

     return { success: true, result };
   });
   ```

2. **Deploy**:
   ```bash
   firebase deploy --only functions:myNewFunction
   ```

3. **Call from Frontend**:
   ```javascript
   import { httpsCallable } from 'firebase/functions';
   import { functions } from '../config/firebase';

   const myNewFunction = httpsCallable(functions, 'myNewFunction');

   const handleAction = async () => {
     try {
       const result = await myNewFunction({ param: 'value' });
       console.log(result.data);
     } catch (error) {
       console.error(error);
     }
   };
   ```

### Adding a New Firestore Collection

1. **Define Schema** (DATABASE_SCHEMA.md):
   ```markdown
   ### New Collection

   **Collection**: `new_items`

   **Fields**:
   - `id`: string (auto-generated)
   - `name`: string
   - `createdAt`: Timestamp
   ```

2. **Update Security Rules** (`firestore.rules`):
   ```javascript
   match /new_items/{itemId} {
     allow read: if isAuthenticated();
     allow create: if isManager();
   }
   ```

3. **Create Service** (`services/firestore.js`):
   ```javascript
   export const newItemService = {
     async getAll() {
       const snapshot = await getDocs(collection(db, 'new_items'));
       return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
     },

     async create(data) {
       const docRef = await addDoc(collection(db, 'new_items'), {
         ...data,
         createdAt: new Date()
       });
       return docRef.id;
     }
   };
   ```

---

## Common Development Tasks

### Reset Super Admin Password

```bash
cd scripts
node reset-superadmin-password.cjs
```

### Clear Firestore Data

**CAUTION**: This deletes all data!

```bash
firebase firestore:delete --all-collections --yes
```

### Export Firestore Data

```bash
# Using Firebase CLI (requires Cloud project)
gcloud firestore export gs://BUCKET_NAME/backups/$(date +%Y%m%d)
```

### Generate QR Code for Testing

1. Login as manager
2. Go to `/qr-generator`
3. Select "General" or "Table-specific"
4. Click "Générer le QR Code"
5. Download or print

### Update Firestore Index

Edit `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy:
```bash
firebase deploy --only firestore:indexes
```

### Hot Reload Not Working

**Fix**:
```bash
# Frontend
cd frontend
rm -rf node_modules .vite
npm install
npm run dev

# Functions
cd functions
rm -rf node_modules
npm install
```

---

## Troubleshooting

### Issue: Firebase CLI Not Installed

**Error**: `firebase: command not found`

**Solution**:
```bash
npm install -g firebase-tools
```

---

### Issue: Port Already in Use

**Error**: `Port 5173 is already in use`

**Solution**:
```bash
# Find process using port
lsof -ti:5173

# Kill process
kill -9 <PID>

# Or use different port
cd frontend
npm run dev -- --port 3000
```

---

### Issue: Firebase Permission Denied

**Error**: `Missing or insufficient permissions`

**Solution**:
1. Check Firestore rules are deployed
2. Verify user is authenticated
3. Check custom claims in token:
   ```javascript
   const idToken = await auth.currentUser.getIdTokenResult();
   console.log(idToken.claims);
   ```

---

### Issue: Function Not Updating

**Symptom**: Changes to Cloud Functions not reflected

**Solution**:
```bash
# Redeploy function
firebase deploy --only functions:functionName

# Or restart emulators
# Ctrl+C to stop, then:
firebase emulators:start
```

---

### Issue: Module Not Found

**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Development Best Practices

### 1. Always Pull Before Starting Work

```bash
git pull origin main
```

### 2. Use Feature Branches

```bash
git checkout -b feature/new-feature
```

### 3. Commit Often

Small, focused commits are better than large ones.

### 4. Test Before Pushing

Run linter and test manually before pushing.

### 5. Use Emulators for Testing

Avoid testing directly on production Firebase.

### 6. Keep Dependencies Updated

```bash
npm outdated
npm update
```

### 7. Review Code Before Committing

Use `git diff` to review changes.

### 8. Document New Features

Update relevant .md files when adding features.

### 9. Use Environment Variables

Don't commit secrets or API keys.

### 10. Ask for Help

If stuck, check documentation or ask team members.

---

## Useful Commands Cheat Sheet

### NPM
```bash
npm install                  # Install dependencies
npm run dev                  # Start dev server
npm run build                # Build for production
npm run lint                 # Check code style
npm outdated                 # Check for updates
npm update                   # Update dependencies
```

### Firebase
```bash
firebase login               # Authenticate
firebase use dev             # Switch to dev project
firebase deploy              # Deploy everything
firebase deploy --only functions  # Deploy functions only
firebase emulators:start     # Start emulators
firebase functions:log       # View function logs
```

### Git
```bash
git status                   # Check status
git add .                    # Stage all changes
git commit -m "message"      # Commit changes
git push origin branch       # Push to remote
git pull origin main         # Pull latest changes
git checkout -b feature/x    # Create feature branch
git merge main               # Merge main into current
```

---

## Related Documentation

- [Technical Overview](./TECHNICAL_OVERVIEW.md) - System architecture
- [Frontend Guide](./FRONTEND_GUIDE.md) - React components and patterns
- [API Reference](./API_REFERENCE.md) - Cloud Functions documentation
- [Database Schema](./DATABASE_SCHEMA.md) - Firestore structure
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production deployment
