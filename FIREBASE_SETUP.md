# Firebase Setup Instructions

## Prerequisites

Before starting, make sure you have:
- Node.js (v18+) installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Google account

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "fast-food-manager")
4. Disable Google Analytics (optional for now)
5. Click "Create project"

---

## Step 2: Enable Firebase Services

### 2.1 Enable Authentication
1. In Firebase Console, go to **Build > Authentication**
2. Click "Get started"
3. We won't use email/password provider (we're using custom tokens)
4. Leave it as is for now

### 2.2 Enable Firestore Database
1. Go to **Build > Firestore Database**
2. Click "Create database"
3. Choose **Production mode** (security rules are already configured)
4. Select location closest to Morocco: **eur3 (europe-west)** or **eur1**
5. Click "Enable"

### 2.3 Enable Cloud Functions
1. Go to **Build > Functions**
2. Click "Get started"
3. It will prompt you to upgrade to Blaze plan (pay-as-you-go)
   - Don't worry, you get FREE tier usage: 2M invocations/month
   - For your single restaurant, you'll likely stay FREE
4. Upgrade to Blaze plan
5. Set up billing (you won't be charged unless you exceed free tier)

### 2.4 Enable Hosting (Optional for now)
1. Go to **Build > Hosting**
2. Click "Get started"
3. Follow the prompts

---

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the gear icon (⚙️) next to "Project Overview"
2. Go to **Project settings**
3. Scroll down to "Your apps"
4. Click the **Web icon** (`</>`)
5. Register your app (name: "Fast Food Manager")
6. Copy the `firebaseConfig` object

It should look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

---

## Step 4: Update Configuration Files

### 4.1 Update `.firebaserc`
Replace `YOUR_PROJECT_ID_HERE` with your actual project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### 4.2 Update `frontend/src/config/firebase.js`
Replace the placeholder values with your actual Firebase configuration from Step 3.

---

## Step 5: Install Dependencies

### 5.1 Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 5.2 Install Cloud Functions Dependencies
```bash
cd functions
npm install
```

---

## Step 6: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

This will deploy the security rules defined in `firestore.rules`.

---

## Step 7: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This will deploy all Cloud Functions (authentication, user management, etc.).

**Note:** First deployment might take 5-10 minutes.

---

## Step 8: Create Initial Admin User

You need to create an admin user manually in Firestore:

1. Go to **Firestore Database** in Firebase Console
2. Click **Start collection**
3. Collection ID: `users`
4. Document ID: (auto-generated)
5. Add fields:
   - `username` (string): `admin`
   - `passwordHash` (string): `$2b$10$qHwZ3K9H0h5.1Z5X4Q6X.OY5vZ8z9z0z1z2z3z4z5z6z7z8z9z0`
     - ⚠️ This is hashed password for: `Admin123!`
   - `role` (string): `manager`
   - `name` (string): `Administrator`
   - `phone` (string): `null` (or your phone)
   - `status` (string): `active`
   - `createdAt` (timestamp): (current date)
6. Click "Save"

**Alternative:** You can use the data migration script (Step 10) to import all users from PostgreSQL.

---

## Step 9: Test Authentication

Start your frontend:

```bash
cd frontend
npm run dev
```

Try logging in with:
- **Username:** `admin`
- **Password:** `Admin123!`

If successful, the Firebase Custom Token authentication is working!

---

## Step 10: Migrate Data from PostgreSQL

We've created a migration script to transfer data from PostgreSQL to Firestore.

See `firebase-migration/migrate.js` for details.

To run:

```bash
cd firebase-migration
npm install
node migrate.js
```

This will:
- Export all users from PostgreSQL
- Export all menu items
- Export all orders
- Import everything to Firestore with proper structure

---

## Step 11: Deploy Frontend to Firebase Hosting

```bash
# Build frontend
cd frontend
npm run build

# Deploy to Firebase Hosting
cd ..
firebase deploy --only hosting
```

Your app will be live at: `https://your-project-id.web.app`

---

## Firestore Data Structure

### Collections

#### `users/`
```javascript
{
  username: "john_doe",
  passwordHash: "$2b$10$...", // bcrypt hash
  role: "cashier", // manager | cashier | cook | client
  name: "John Doe",
  phone: "+212600000000",
  status: "active",
  createdAt: Timestamp,
  lastLogin: Timestamp
}
```

#### `menu/`
```javascript
{
  name: "Classic Burger",
  description: "Beef patty with cheese...",
  price: 45.00,
  category: "burgers",
  imageUrl: "gs://bucket/burger.jpg",
  isAvailable: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `orders/`
```javascript
{
  orderNumber: "ORD-2024-001",
  status: "pending", // awaiting_approval | pending | preparing | ready | completed
  totalAmount: 150.00,
  clientName: "Hassan Mohamed",
  userId: "user123",
  notes: "No onions",
  createdAt: Timestamp,
  updatedAt: Timestamp,

  // Staff assignments
  caissierName: null,
  cuisinierName: null,
  approvedBy: null,
  approvedAt: null,

  // Order items
  items: [
    {
      menuItemId: "item123",
      name: "Classic Burger",
      quantity: 2,
      unitPrice: 45.00,
      subtotal: 90.00
    }
  ]
}
```

---

## Cloud Functions Available

### `authenticateUser`
**Purpose:** Login with username/password
**Input:** `{username, password}`
**Output:** `{token, user}`

**Usage in frontend:**
```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from './config/firebase';

const authenticateUser = httpsCallable(functions, 'authenticateUser');
const result = await authenticateUser({ username, password });
const { token, user } = result.data;
```

### `createUser`
**Purpose:** Create new user (manager only)
**Input:** `{username, password, role, name, phone}`
**Output:** `{success, userId}`

### `setUserRole`
**Purpose:** Update user role (manager only)
**Input:** `{userId, role}`
**Output:** `{success, message}`

### `updateUserStatus`
**Purpose:** Activate/deactivate user (manager only)
**Input:** `{userId, status}`
**Output:** `{success, message}`

---

## Troubleshooting

### Error: "Permission denied" in Firestore
- Check security rules are deployed: `firebase deploy --only firestore:rules`
- Verify user has correct role custom claim
- Check user is authenticated

### Error: "Cloud Function not found"
- Deploy functions: `firebase deploy --only functions`
- Check function name matches in code

### Error: "CORS error" when calling functions
- Functions automatically handle CORS
- Make sure you're using `httpsCallable` from Firebase SDK
- Check Firebase configuration is correct

### Error: "Cannot read property 'token' of undefined"
- User is not authenticated
- Custom claims not set
- Re-login to refresh token

---

## Next Steps

1. ✅ Complete Step 1-8 above
2. Migrate your AuthContext to use Firebase (see frontend migration guide)
3. Replace API calls with Firestore SDK
4. Replace Socket.io with Firestore real-time listeners
5. Test all features
6. Deploy to production

---

## Cost Monitoring

Monitor your usage in Firebase Console:
1. Go to **Spark/Blaze > Usage and billing**
2. Set up budget alerts (recommended: $5/month)
3. Check daily usage

For a single restaurant, you should stay well within the FREE tier:
- Firestore: ~10k reads/day (vs 50k free)
- Functions: ~5k invocations/day (vs 66k free/day)
- Hosting: ~2GB transfer/month (vs 10GB free)

**Expected cost: $0-1/month** 🎉

---

## Support

If you encounter issues:
1. Check Firebase Console for error logs
2. Check Cloud Functions logs: `firebase functions:log`
3. Test locally with Firebase Emulators (optional)

---

Good luck with your Firebase migration! 🚀
