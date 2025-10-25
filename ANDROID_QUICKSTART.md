# 🚀 Android App Quick Start Guide

## ✅ What's Ready

- ✅ Android app compiled and installed
- ✅ Firebase project configured (`fast-food-manager-b1f54`)
- ✅ Firestore security rules deployed
- ✅ Firestore indexes deployed
- ✅ Cloud Functions deployed (8 functions)
- ✅ **Shares data with web application** (same Firestore database)

---

## 📱 Using the Android App

### Prerequisites

Your web application should already have:
- Users created (clients, managers, cashiers, cooks)
- Menu items in Firestore (`menu` collection)
- Orders data (if applicable)

### Install the App

```bash
cd "/Users/elmehdimotaqi/Documents/Fasr food project/android"

# Install on connected device
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Login with Existing Credentials

The Android app uses the **same user database** as your web application.

**Login with any existing user:**
- Use the same **username** and **password** from your web app
- Example: If you have a user `client` in the web app, login with those credentials

**Example:**
```
Username: client
Password: (your web app password)
```

---

## 📊 Shared Data Between Web & Android

Both applications share the same Firestore collections:

### Collections Used:

1. **`users`** - User accounts (clients, managers, cashiers, cooks)
2. **`menu`** - Menu items (visible in both web and mobile)
3. **`orders`** - Orders (created from either app, visible in both)

### Real-time Sync:

- ✅ Add a menu item in web app → Appears instantly in Android
- ✅ Place an order in Android → Appears in web app dashboard
- ✅ Update order status in web app → Updates in Android
- ✅ User changes sync across both platforms

---

## 🧪 Testing the App

### 1. Launch the App

Open the app on your Android device/emulator.

### 2. Login

- Enter your **web app username**
- Enter your **web app password**
- Tap **Login**

### 3. Test Features

✅ **Menu Screen:**
- Should display menu items from your web app
- Filter by category
- Search for items
- Add items to cart

✅ **Cart:**
- View cart items
- Adjust quantities
- Add notes to items
- See total price
- Place order

✅ **Orders Screen:**
- View "Active" orders (pending, preparing, ready)
- View "Historique" (all orders)
- See real-time status updates
- Cancel pending orders (client only)

✅ **Profile:**
- View user information
- See role (Client/Manager/Cashier/Cook)
- Logout

### 4. Test Offline Functionality

- Turn off WiFi/mobile data
- Browse menu (works from cache)
- Add items to cart (stored locally)
- Place order (queued for sync)
- Turn on internet → Order syncs automatically

---

## 🔧 Common Commands

### Rebuild the App

```bash
cd "/Users/elmehdimotaqi/Documents/Fasr food project/android"
./gradlew clean assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

### View Android Logs

```bash
adb logcat | grep -E "Firestore|Firebase|FastFood"
```

### View Firebase Function Logs

```bash
cd "/Users/elmehdimotaqi/Documents/Fasr food project"
firebase functions:log
```

### Redeploy Firestore Rules

```bash
cd "/Users/elmehdimotaqi/Documents/Fasr food project"
firebase deploy --only firestore:rules
```

---

## 📚 Documentation

- **Android Firebase Setup**: `ANDROID_FIREBASE_SETUP.md`
- **Web App Firebase Setup**: `FIREBASE_SETUP.md`
- **Android Source Code**: `android/app/src/main/java/com/fast/manger/food/`

---

## 🐛 Troubleshooting

### "Permission denied" error

```bash
cd "/Users/elmehdimotaqi/Documents/Fasr food project"
firebase deploy --only firestore:rules
```

### Menu not loading

1. Check internet connection
2. Verify menu items exist in web app
3. Check Android logs: `adb logcat | grep Firestore`

### Login fails

1. Verify user exists in web app (check Firestore Console → users)
2. Try logging in via web app first
3. Check function logs: `firebase functions:log`

### Google Play Services error

This means SHA-1 fingerprint needs to be configured:

1. Get SHA-1:
```bash
cd "/Users/elmehdimotaqi/Documents/Fasr food project/android"
./gradlew signingReport | grep SHA1
```

2. Add SHA-1 to Firebase Console:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Android app
   - Add SHA-1 fingerprint
   - Download new `google-services.json`
   - Replace in `android/app/`
   - Rebuild app

---

## 💡 Adding Menu Items

Since the Android app shares data with the web app, **add menu items from your web application**.

They will automatically appear in the Android app in real-time.

Alternatively, add directly to Firestore:

1. Go to [Firestore Console](https://console.firebase.google.com/project/fast-food-manager-b1f54/firestore)
2. Click on `menu` collection
3. Add document with fields:
   ```
   name: "Item Name"
   description: "Description"
   price: 50.00
   category: "Burgers" (or Pizza, Boissons, Desserts)
   imageUrl: null
   isAvailable: true
   createdAt: (timestamp in ms)
   updatedAt: (timestamp in ms)
   ```

---

## 💰 Cost Estimate

**Free Tier** is very generous:
- 50,000 Firestore reads/day
- 2M Cloud Function invocations/month
- Unlimited Authentication

**Your expected usage** (single restaurant):
- ~1,000 reads/day
- ~500 function calls/day
- ~50 orders/day

**Expected monthly cost**: **$0** 🎉

---

## 📞 Quick Links

- **Firebase Console**: https://console.firebase.google.com/project/fast-food-manager-b1f54
- **Firestore Data**: https://console.firebase.google.com/project/fast-food-manager-b1f54/firestore
- **Cloud Functions**: https://console.firebase.google.com/project/fast-food-manager-b1f54/functions
- **Authentication**: https://console.firebase.google.com/project/fast-food-manager-b1f54/authentication

---

## 🎯 Key Differences from Web App

| Feature | Web App | Android App |
|---------|---------|-------------|
| Menu Management | ✅ Create/Edit/Delete | ❌ Read-only |
| Order Taking | ✅ Full control | ✅ Clients can order |
| Order Status Updates | ✅ All staff roles | ❌ View only |
| User Management | ✅ Manager only | ❌ Not available |
| Dashboard/Analytics | ✅ Available | ❌ Not available |
| Offline Mode | Partial | ✅ Full offline support |
| Real-time Updates | ✅ | ✅ |

---

## 🎉 You're All Set!

Your Android app is now integrated with your web application and shares the same database.

- Login with your **existing web app credentials**
- View the **same menu items**
- Place orders that appear in **both apps**
- Enjoy **real-time synchronization**

---

**Last Updated**: October 23, 2024
**Project**: Fast Food Manager
**Firebase Project**: fast-food-manager-b1f54
**Android Package**: com.fast.manger.food
