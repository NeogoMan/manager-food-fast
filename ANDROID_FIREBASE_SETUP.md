# Firebase Backend Setup for Android App

Complete guide to set up the Firebase backend specifically for the Fast Food Manager Android application.

## 📋 Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Node.js 18+ installed
- Firebase project: `fast-food-manager-b1f54` (already created)
- Admin access to Firebase Console

---

## 🚀 Quick Start (5 Steps)

```bash
# 1. Login to Firebase
firebase login

# 2. Deploy Firestore rules and indexes
firebase deploy --only firestore

# 3. Deploy Cloud Functions
firebase deploy --only functions

# 4. Initialize sample data
npm install firebase-admin bcrypt
node init-firebase-data.js

# 5. Test on Android app
cd android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## 📝 Detailed Setup Instructions

### Step 1: Enable Firebase Services

#### A. Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **fast-food-manager-b1f54**
3. Navigate to **Firestore Database**
4. If not already enabled:
   - Click **Create database**
   - Choose **Production mode**
   - Select location: **europe-west** (closest to Morocco)
   - Click **Enable**

#### B. Enable Firebase Authentication

1. Navigate to **Authentication**
2. Click **Get started** (if not enabled)
3. Enable **Email/Password** sign-in method
   - Click **Email/Password**
   - Enable the toggle
   - Click **Save**

**Note**: We use custom authentication via Cloud Functions, but Email/Password must be enabled for custom tokens to work.

#### C. Upgrade to Blaze Plan (Required for Cloud Functions)

1. Go to ⚙️ **Settings** → **Usage and billing**
2. Click **Modify plan**
3. Select **Blaze (Pay as you go)**
4. Configure billing

**Don't worry about cost**:
- Free tier: 2M function invocations/month
- Free tier: 50K Firestore reads/day
- For a single restaurant, you'll likely stay FREE
- Expected cost: **$0-1/month**

---

### Step 2: Deploy Firestore Configuration

Navigate to project directory:

```bash
cd "/Users/elmehdimotaqi/Documents/Fasr food project"
```

#### Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

**What this does**:
- Protects your data with role-based access control
- Only authenticated users can access data
- Clients can only see their own orders
- Managers can manage all data
- Public can read menu items

#### Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

**What this does**:
- Creates composite indexes for efficient queries
- Required for:
  - Filtering orders by userId + createdAt
  - Filtering menu items by category + isAvailable
  - Searching and sorting

#### Verify Deployment

1. Go to Firebase Console → Firestore → Rules
2. Check last deployment timestamp
3. Go to Firestore → Indexes
4. Wait for indexes to finish building (may take a few minutes)

---

### Step 3: Deploy Cloud Functions

#### Install Dependencies

```bash
cd functions
npm install
cd ..
```

#### Deploy Functions

```bash
firebase deploy --only functions
```

**First deployment may take 5-10 minutes.**

#### Available Functions

| Function | Type | Purpose |
|----------|------|---------|
| `authenticateUser` | HTTPS Callable | Login with username/password, returns custom auth token |
| `createUser` | HTTPS Callable | Create new user (manager only) |
| `updateOrderStatus` | Firestore Trigger | Sends notifications on order status changes |

#### Verify Functions

```bash
firebase functions:list
```

You should see:
```
✔ authenticateUser(us-central1)
✔ createUser(us-central1)
```

#### Test Authentication Function

```bash
curl -X POST \
  https://us-central1-fast-food-manager-b1f54.cloudfunctions.net/authenticateUser \
  -H 'Content-Type: application/json' \
  -d '{"data": {"username": "client1", "password": "password123"}}'
```

Expected response:
```json
{
  "result": {
    "success": true,
    "token": "eyJhbGciOiJS...",
    "user": {
      "id": "user_client_1",
      "username": "client1",
      "name": "Ahmed El Mansouri",
      "role": "client"
    }
  }
}
```

---

### Step 4: Initialize Sample Data

#### Download Service Account Key

1. Go to Firebase Console → ⚙️ **Settings** → **Service accounts**
2. Click **Generate new private key**
3. Click **Generate key**
4. Save the downloaded JSON file as:
   ```
   /Users/elmehdimotaqi/Documents/Fasr food project/serviceAccountKey.json
   ```

**⚠️ Security Warning**: This file grants admin access to your Firebase project. Never commit it to Git!

#### Run Initialization Script

```bash
# Install dependencies
npm install firebase-admin bcrypt

# Run script
node init-firebase-data.js
```

#### What Gets Created

**4 Test Users**:

| Username | Password | Role | Name |
|----------|----------|------|------|
| client1 | password123 | client | Ahmed El Mansouri |
| manager | manager123 | manager | Fatima Zahra |
| cashier | cashier123 | cashier | Mohammed Benali |
| cook | cook123 | cook | Hassan Alami |

**12 Menu Items**:
- **Burgers** (3 items): 45-65 MAD
- **Pizzas** (3 items): 60-75 MAD
- **Drinks** (3 items): 8-15 MAD
- **Desserts** (3 items): 20-30 MAD

**1 Sample Order**:
- Client: client1
- Items: 2× Burger Classique, 2× Coca-Cola
- Total: 110.00 MAD
- Status: pending

#### Verify Data in Console

1. Go to Firestore → Data
2. Check collections exist:
   - `users` (4 documents)
   - `menu_items` (12 documents)
   - `orders` (1 document)

---

### Step 5: Test the Android App

#### Install APK

```bash
cd android
adb install app/build/outputs/apk/debug/app-debug.apk
```

#### Launch and Test

1. **Open the app** on your device/emulator

2. **Login** with test credentials:
   - Username: `client1`
   - Password: `password123`

3. **Test Features**:

   ✅ **Menu Screen**:
   - Should show 12 menu items
   - Filter by category (Burgers, Pizzas, Drinks, Desserts)
   - Search for items

   ✅ **Cart**:
   - Add items to cart
   - Adjust quantities
   - Add notes to items
   - See total calculation

   ✅ **Place Order**:
   - Review cart
   - Add order notes
   - Place order
   - Should navigate to Orders screen

   ✅ **Orders Screen**:
   - View "Active" orders
   - View "Historique" (all orders)
   - See real-time status updates
   - Cancel pending orders

   ✅ **Profile**:
   - View user information
   - See role (Client)
   - Logout

4. **Test Offline Functionality**:
   - Turn off WiFi/mobile data
   - Browse menu (should work from cache)
   - Add items to cart (local storage)
   - Place order (queued for later)
   - Turn on internet
   - Order should sync automatically

---

## 📊 Data Structure Reference

### Collection: `users`

```kotlin
data class User(
    val id: String,
    val username: String,
    val name: String,
    val phone: String?,
    val role: UserRole,  // CLIENT, MANAGER, CASHIER, COOK
    val isActive: Boolean,
    val createdAt: Long,
    val updatedAt: Long
)
```

**Firestore document**:
```json
{
  "username": "client1",
  "passwordHash": "$2b$10$...",
  "name": "Ahmed El Mansouri",
  "phone": "+212612345678",
  "role": "client",
  "isActive": true,
  "createdAt": 1729684800000,
  "updatedAt": 1729684800000
}
```

### Collection: `menu_items`

```kotlin
data class MenuItem(
    val id: String,
    val name: String,
    val description: String,
    val price: Double,
    val category: MenuCategory,  // BURGERS, PIZZAS, DRINKS, DESSERTS
    val imageUrl: String?,
    val isAvailable: Boolean,
    val createdAt: Long,
    val updatedAt: Long
)
```

**Firestore document**:
```json
{
  "name": "Burger Classique",
  "description": "Burger avec steak haché, salade, tomate, oignon",
  "price": 45.00,
  "category": "burgers",
  "imageUrl": null,
  "isAvailable": true,
  "createdAt": 1729684800000,
  "updatedAt": 1729684800000
}
```

### Collection: `orders`

```kotlin
data class Order(
    val id: String,
    val userId: String,
    val orderNumber: String,
    val items: List<OrderItem>,
    val totalAmount: Double,
    val status: OrderStatus,  // PENDING, AWAITING_APPROVAL, etc.
    val notes: String?,
    val createdAt: Long,
    val updatedAt: Long
)

data class OrderItem(
    val menuItemId: String,
    val name: String,
    val price: Double,
    val quantity: Int,
    val subtotal: Double,
    val notes: String?
)
```

**Firestore document**:
```json
{
  "userId": "user_client_1",
  "orderNumber": "ORD-001",
  "items": [
    {
      "menuItemId": "menu_burger_1",
      "name": "Burger Classique",
      "price": 45.00,
      "quantity": 2,
      "subtotal": 90.00,
      "notes": null
    }
  ],
  "totalAmount": 110.00,
  "status": "pending",
  "notes": "Sans oignons s'il vous plaît",
  "createdAt": 1729684800000,
  "updatedAt": 1729684800000
}
```

---

## 🔐 Security Rules Explained

### Users Collection

```javascript
match /users/{userId} {
  // Anyone authenticated can read all users (for assignments, etc.)
  allow read: if isAuthenticated();

  // Only managers can create users
  allow create: if isManager();

  // Managers or owner can update
  allow update: if isManager() || isOwner(userId);

  // Only managers can delete
  allow delete: if isManager();
}
```

### Menu Items Collection

```javascript
match /menu_items/{itemId} {
  // Public read for everyone (even unauthenticated)
  allow read: if true;

  // Only managers can write
  allow create, update, delete: if isManager();
}
```

### Orders Collection

```javascript
match /orders/{orderId} {
  // Staff and order owner can read
  allow read: if isStaff() ||
                 (isClient() && resource.data.userId == request.auth.uid);

  // Clients can create their own orders
  allow create: if isClient() && request.resource.data.userId == request.auth.uid;

  // Staff can update all orders
  // Clients can only cancel their pending orders
  allow update: if isStaff() ||
                   (isClient() && canCancelOrder());

  // Only managers can delete
  allow delete: if isManager();
}
```

---

## 🐛 Troubleshooting

### Error: "Permission denied" on login

**Cause**: Firestore rules not deployed or user doesn't exist

**Solution**:
```bash
# Redeploy rules
firebase deploy --only firestore:rules

# Verify user exists
# Go to Firestore Console → users collection
```

### Error: "User not found"

**Cause**: Sample data not initialized

**Solution**:
```bash
# Re-run initialization script
node init-firebase-data.js
```

### Error: "Invalid password"

**Cause**: Password hash mismatch or wrong password

**Solution**:
- Verify you're using correct test credentials
- Re-run initialization script to reset passwords

### Menu items not loading

**Causes**:
1. No internet connection
2. Firestore rules blocking access
3. Collection name mismatch

**Debug**:
```bash
# Check Android logs
adb logcat | grep -i "firestore\|error"

# Check Firestore Console
# Go to Firestore → Data → menu_items

# Check rules deployment
firebase deploy --only firestore:rules
```

### Orders not syncing

**Cause**: Offline mode or Firestore listeners not working

**Debug**:
```kotlin
// In Android logs, look for:
// "Firestore: observeOrdersByUserId"
adb logcat | grep "Firestore\|Order"
```

### Cloud Function not found

**Cause**: Functions not deployed

**Solution**:
```bash
# Deploy functions
firebase deploy --only functions

# Verify deployment
firebase functions:list
```

---

## 💰 Cost Monitoring

### Free Tier Limits (Generous!)

- **Firestore**:
  - 50,000 reads/day
  - 20,000 writes/day
  - 20,000 deletes/day
  - 1 GiB storage

- **Cloud Functions**:
  - 2M invocations/month
  - 400,000 GB-seconds compute time/month
  - 200,000 GHz-seconds compute time/month

- **Authentication**:
  - Unlimited (free)

### Expected Usage for Single Restaurant

**Daily**:
- Menu reads: ~500-1,000
- Order writes: ~50-100
- Authentication calls: ~20-50

**Monthly estimate**: **$0-2** 🎉

### Monitor Usage

1. Go to Firebase Console → ⚙️ Settings → Usage and billing
2. Set budget alerts (recommended: $5/month)
3. Check daily usage dashboard

---

## 🔄 Adding Real Menu Data

### Option 1: Firebase Console (Manual)

1. Go to Firestore → Data → menu_items
2. Click **Add document**
3. Fill in fields:
   ```
   name: "Your Menu Item"
   description: "Item description"
   price: 50.00
   category: "burgers"
   imageUrl: null (or add image URL)
   isAvailable: true
   createdAt: (current timestamp)
   updatedAt: (current timestamp)
   ```

### Option 2: Bulk Import Script

Create `add-menu-items.js`:

```javascript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const yourMenuItems = [
  {
    name: "Tacos Poulet",
    description: "Tacos avec poulet mariné, légumes frais",
    price: 35.00,
    category: "burgers",
    imageUrl: null,
    isAvailable: true
  },
  // Add more items...
];

async function addItems() {
  const batch = db.batch();

  yourMenuItems.forEach((item, index) => {
    const ref = db.collection('menu_items').doc(`custom_item_${index + 1}`);
    batch.set(ref, {
      ...item,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  });

  await batch.commit();
  console.log('✅ Menu items added!');
}

addItems();
```

Run: `node add-menu-items.js`

---

## 🎯 Next Steps

### Immediate

- [x] Deploy Firestore rules and indexes
- [x] Deploy Cloud Functions
- [x] Initialize sample data
- [x] Test Android app
- [ ] Add real menu items
- [ ] Test with multiple users
- [ ] Test order workflow end-to-end

### Future Enhancements

- [ ] Add Firebase Cloud Messaging for push notifications
- [ ] Implement manager dashboard (web or Android)
- [ ] Add cashier interface for payment processing
- [ ] Add cook interface for kitchen display
- [ ] Implement real-time order tracking
- [ ] Add image upload for menu items
- [ ] Add order history export
- [ ] Add sales analytics

---

## 📞 Support

### Quick Commands

```bash
# View Cloud Function logs
firebase functions:log

# View specific function logs
firebase functions:log --only authenticateUser

# Deploy everything at once
firebase deploy

# Test locally with emulators (optional)
firebase emulators:start
```

### Debugging Tips

1. **Check Android logs**: `adb logcat | grep -E "Firestore|Firebase|Error"`
2. **Check Function logs**: `firebase functions:log`
3. **Check Firestore Console**: Firebase Console → Firestore → Data
4. **Check Auth Console**: Firebase Console → Authentication → Users

---

## ✅ Verification Checklist

Before considering setup complete:

- [ ] Firestore rules deployed successfully
- [ ] Firestore indexes built (check Console)
- [ ] Cloud Functions deployed (verify with `firebase functions:list`)
- [ ] Sample data exists in Firestore (4 users, 12 menu items, 1 order)
- [ ] Can login with `client1` / `password123`
- [ ] Menu items load in Android app
- [ ] Can add items to cart
- [ ] Can place an order
- [ ] Order appears in Orders screen
- [ ] Can view profile
- [ ] Can logout
- [ ] Offline functionality works

---

**Setup completed!** 🎉

Your Firebase backend is now fully configured for the Android app. Test all features and add your real menu data!

---

**Last Updated**: October 23, 2024
**Project**: Fast Food Manager
**Firebase Project**: fast-food-manager-b1f54
**Android Package**: com.fast.manger.food
