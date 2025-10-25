# 🚀 Firebase Deployment Instructions

## Current Status

✅ **Completed:**
- Firebase project configured (fast-food-manager-b1f54)
- Cloud Functions code written
- Firestore security rules written
- Frontend authentication migrated
- Firestore services created
- Cloud Functions services created

🚧 **Remaining:**
- Deploy Cloud Functions
- Deploy Firestore rules
- Update frontend components to use Firestore
- Test everything
- Deploy to Firebase Hosting

---

## Step 1: Deploy Firebase Backend (5-15 minutes)

### 1.1 Install Cloud Functions Dependencies

```bash
cd functions
npm install
```

This will install:
- `firebase-admin` - Firebase Admin SDK
- `firebase-functions` - Cloud Functions SDK
- `bcrypt` - Password hashing

### 1.2 Deploy Firestore Rules & Indexes

```bash
cd ..
firebase deploy --only firestore:rules,firestore:indexes
```

Expected output:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/fast-food-manager-b1f54/overview
```

### 1.3 Deploy Cloud Functions

```bash
firebase deploy --only functions
```

**Note:** First deployment takes 5-10 minutes.

Expected output:
```
✔  functions[authenticateUser(us-central1)] Successful create operation.
✔  functions[createUser(us-central1)] Successful create operation.
✔  functions[setUserRole(us-central1)] Successful create operation.
✔  functions[updateUserStatus(us-central1)] Successful create operation.
✔  functions[onOrderApproved(us-central1)] Successful create operation.
✔  functions[onOrderCompleted(us-central1)] Successful create operation.

✔  Deploy complete!
```

### 1.4 Verify Deployment

```bash
firebase functions:list
```

You should see all 6 functions listed.

---

## Step 2: Create Initial Data

### Option A: Migrate from PostgreSQL (Recommended)

If you have existing data in PostgreSQL:

```bash
cd firebase-migration
npm install

# Download service account key first!
# Firebase Console > Project Settings > Service Accounts > Generate New Private Key
# Save as: serviceAccountKey.json

node migrate.js
```

### Option B: Create Admin User Manually

If you want to start fresh:

1. Go to [Firebase Console](https://console.firebase.google.com/project/fast-food-manager-b1f54/firestore)
2. Click "Start collection"
3. Collection ID: `users`
4. Add document (auto ID):

```
username: "admin"
passwordHash: "$2b$10$YwlYmYrz5HZF8QHKmQ8Pru5F.3WJXf7x5oOmX8xK5cQ5dZ8xZ8xZO"  // = "Admin123!"
role: "manager"
name: "Administrator"
phone: null
status: "active"
createdAt: (timestamp) now
```

**Or use this bcrypt hash for "Admin123!":**
```
$2b$10$YwlYmYrz5HZF8QHKmQ8Pru5F.3WJXf7x5oOmX8xK5cQ5dZ8xZ8xZO
```

---

## Step 3: Test Authentication

### 3.1 Start Frontend

```bash
cd frontend
npm run dev
```

### 3.2 Login

Go to http://localhost:5173

Login with:
- **Username:** `admin`
- **Password:** `Admin123!`

### 3.3 Verify

If login succeeds:
- ✅ Cloud Functions are working
- ✅ Authentication is working
- ✅ Firestore rules are working

If login fails:
1. Check browser console for errors
2. Check Cloud Functions logs: `firebase functions:log`
3. Verify user exists in Firestore

---

## Step 4: Update Frontend Components (Manual)

The following components need to be updated to use Firestore:

### Priority 1 (Critical for basic functionality)

1. **`pages/Menu.jsx`**
   - Replace API calls with `menuService`
   - Add real-time subscription

2. **`pages/Orders.jsx`**
   - Replace API calls with `ordersService`
   - Add real-time subscription

3. **`pages/Kitchen.jsx`**
   - Replace Socket.io with `ordersService.subscribeToKitchen()`

4. **`pages/Users.jsx`**
   - Replace API calls with `usersService` and `userFunctions`

### Priority 2 (Important)

5. **`pages/CustomerMenu.jsx`**
   - Use `menuService.getAvailable()`

6. **`pages/Cart.jsx`**
   - Use `ordersService.create()`

7. **`pages/MyOrders.jsx`**
   - Use `ordersService.getByUserId()`

8. **`pages/Dashboard.jsx`**
   - Use `dashboardService.getTodayStats()`

### How to Update

Follow the patterns in `FRONTEND_MIGRATION_GUIDE.md`:

**Before:**
```javascript
const response = await fetch('/api/menu');
const items = await response.json();
```

**After:**
```javascript
import { menuService } from '../services/firestore';
const items = await menuService.getAll();
```

Or with real-time:
```javascript
useEffect(() => {
  const unsubscribe = menuService.subscribe((items) => {
    setMenuItems(items);
  });
  return () => unsubscribe();
}, []);
```

---

## Step 5: Remove Old Code (After Testing)

Once everything works with Firestore:

1. **Remove Socket.io:**
   ```bash
   cd frontend
   npm uninstall socket.io-client
   ```

2. **Delete files:**
   - `frontend/src/utils/socketService.js`
   - `frontend/src/contexts/SocketContext.jsx`
   - `frontend/src/components/ConnectionStatus.jsx` (if only for Socket.io)

3. **Remove from App.jsx:**
   - Remove `<SocketProvider>`
   - Remove Socket.io imports

4. **Backend can be kept as backup** for now

---

## Step 6: Deploy to Firebase Hosting

### 6.1 Build Frontend

```bash
cd frontend
npm run build
```

This creates `frontend/dist/` folder.

### 6.2 Deploy

```bash
cd ..
firebase deploy --only hosting
```

### 6.3 Access Your App

Your app will be live at:
```
https://fast-food-manager-b1f54.web.app
```

Or with custom domain (optional):
```
https://fast-food-manager-b1f54.firebaseapp.com
```

---

## Step 7: Configure Custom Domain (Optional)

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow the instructions to add DNS records
4. Firebase will provision SSL certificate automatically

---

## Monitoring & Logs

### View Cloud Functions Logs

```bash
firebase functions:log
```

Or in Firebase Console:
- Functions > Logs

### View Firestore Usage

Firebase Console > Firestore Database > Usage tab

Set up budget alerts:
- Go to: Spark/Blaze > Usage and billing
- Set budget: $5/month (you'll likely stay under $1)

---

## Cost Monitoring

### Expected Usage (Single Restaurant)

| Service | Free Tier | Your Usage | Cost |
|---------|-----------|------------|------|
| Firestore Reads | 50k/day | ~6k/day | $0 |
| Firestore Writes | 20k/day | ~360/day | $0 |
| Cloud Functions | 2M/month | ~5k/month | $0 |
| Hosting | 10GB/month | ~2GB/month | $0 |
| **Total** | - | - | **$0/month** ✅ |

### Set Up Alerts

1. Firebase Console > Spark/Blaze > Usage and billing
2. Set budget alert at $5/month
3. You'll get email if you approach limit

---

## Troubleshooting

### Functions not deploying?

```bash
# Check you're in the right project
firebase use

# Try redeploying
firebase deploy --only functions --force
```

### Permission denied in Firestore?

```bash
# Redeploy rules
firebase deploy --only firestore:rules
```

### Authentication not working?

1. Check Cloud Functions are deployed: `firebase functions:list`
2. Check logs: `firebase functions:log`
3. Verify user exists in Firestore with correct passwordHash

### Frontend errors?

1. Check browser console
2. Verify Firebase config in `frontend/src/config/firebase.js`
3. Check Cloud Functions are deployed

---

## Rollback Plan

If you need to rollback:

### Keep Backend Running

The current PostgreSQL + Express backend can run alongside Firebase.

### Switch Frontend Back

1. Revert AuthContext changes
2. Restore API calls
3. Restore Socket.io

### No Data Loss

- PostgreSQL database is untouched
- Firestore data is separate
- Can export Firestore data anytime

---

## Next Steps Checklist

- [ ] Deploy Cloud Functions: `cd functions && npm install && cd .. && firebase deploy --only functions`
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Create admin user in Firestore
- [ ] Test login at http://localhost:5173
- [ ] Update frontend components (follow FRONTEND_MIGRATION_GUIDE.md)
- [ ] Test all features
- [ ] Deploy to Firebase Hosting: `firebase deploy --only hosting`
- [ ] Monitor usage in Firebase Console

---

## Success Criteria

✅ Login works with username/password
✅ Menu items display
✅ Orders can be created
✅ Real-time updates work (kitchen screen)
✅ User management works (manager can create users)
✅ Dashboard shows stats
✅ Cost stays at $0-5/month

---

## Support

If you encounter issues:

1. **Check Logs:**
   ```bash
   firebase functions:log
   ```

2. **Firebase Console:**
   - Check Functions tab for deployment status
   - Check Firestore tab for data
   - Check Usage tab for quotas

3. **Documentation:**
   - `README_FIREBASE_MIGRATION.md` - Quick start
   - `FIREBASE_SETUP.md` - Detailed setup
   - `FRONTEND_MIGRATION_GUIDE.md` - Component migration
   - `firebase-migration/README.md` - Data migration

4. **Ask for help!**

---

🎉 **Ready to deploy!** Follow the steps above in order.

Good luck! 🚀
