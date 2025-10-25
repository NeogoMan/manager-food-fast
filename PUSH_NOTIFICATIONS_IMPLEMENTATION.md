# Push Notifications Implementation Guide

## Overview
Your Fast Food Order Management System now has **Firebase Cloud Messaging (FCM)** push notifications integrated. This document explains what was implemented and how to use it.

---

## What Was Implemented

### ✅ Backend (Firebase Cloud Functions)

#### 1. **FCM Initialization** (`functions/index.js:15,23`)
- Added Firebase Cloud Messaging import and initialization
- The messaging service is now available for sending push notifications

```javascript
import {getMessaging} from "firebase-admin/messaging";
const messaging = getMessaging();
```

#### 2. **Helper Functions** (`functions/index.js:29-135`)

**`getNotificationTitle(status)`** - Generates French notification titles:
- `preparing` → "Préparation en cours"
- `ready` → "Commande prête!"
- `completed` → "Merci!"
- `rejected` → "Commande refusée"

**`getNotificationBody(orderNumber, status, rejectionReason)`** - Generates notification messages:
- `preparing` → "Votre commande ORD-001 est en cours de préparation."
- `ready` → "Votre commande ORD-001 est prête! Venez la récupérer."
- `completed` → "Votre commande ORD-001 est terminée. Merci de votre visite!"
- `rejected` → "Désolé, votre commande ORD-001 a été refusée. [reason]"

**`getUserFCMToken(userId)`** - Retrieves user's FCM token from Firestore

**`sendOrderStatusNotification(userId, orderId, orderNumber, newStatus, rejectionReason)`** - Sends push notification via FCM with automatic error handling

#### 3. **FCM Token Management Functions** (`functions/index.js:141-227`)

**`registerFCMToken`** - Cloud Function to save user's FCM token
- **Called by:** Android app on login/startup
- **Security:** Requires authentication
- **Stores:** `users/{userId}.fcmToken` and `fcmTokenUpdatedAt`

**`removeFCMToken`** - Cloud Function to remove FCM token on logout
- **Called by:** Android app on logout
- **Security:** Requires authentication
- **Updates:** Sets `fcmToken` to `null`

#### 4. **Order Status Change Trigger** (`functions/index.js:677-764`)

**`onOrderStatusChanged`** - Automatically sends push notifications when order status changes
- **Triggers on:** Any order status update in Firestore
- **Sends notifications for:** `preparing`, `ready`, `completed`, `rejected`
- **Creates:** Both push notification AND Firestore notification document
- **Handles:** Invalid/expired tokens automatically (removes them)

**Replaced old functions:**
- ❌ `onOrderApproved` (old)
- ❌ `onOrderCompleted` (old)
- ✅ `onOrderStatusChanged` (new - handles all status changes)

### ✅ Security Rules Updated (`firestore.rules:44-59`)

Users can now update their own FCM tokens:
```javascript
allow update: if isManager() ||
                 (isOwner(userId) &&
                  request.resource.data.diff(resource.data).affectedKeys()
                    .hasOnly(['fcmToken', 'fcmTokenUpdatedAt']));
```

---

## How It Works

### Flow Diagram

```
┌─────────────────┐
│  Android App    │ (User logs in)
└────────┬────────┘
         │ 1. Get FCM Token from Firebase SDK
         ▼
┌─────────────────────────────────────┐
│  Call registerFCMToken(fcmToken)   │
└────────┬────────────────────────────┘
         │ 2. Store token in Firestore
         ▼
┌──────────────────────────────────┐
│  users/{userId}                  │
│    ├─ fcmToken: "eXaMp..."       │
│    └─ fcmTokenUpdatedAt: Date    │
└──────────────────────────────────┘

         │
         │ 3. Admin updates order status
         ▼
┌──────────────────────────────────┐
│  orders/{orderId}                │
│    └─ status: "ready"            │
└────────┬─────────────────────────┘
         │ 4. Firestore trigger fires
         ▼
┌──────────────────────────────────┐
│  onOrderStatusChanged            │
│    └─ Detects status change      │
└────────┬─────────────────────────┘
         │ 5. Send push notification
         ▼
┌──────────────────────────────────┐
│  FCM Service                     │
│    └─ Delivers to Android device │
└────────┬─────────────────────────┘
         │ 6. User receives notification
         ▼
┌─────────────────┐
│  Android App    │ (Shows notification)
└─────────────────┘
```

---

## What Still Needs to Be Done

### 🔴 Android App Integration (REQUIRED)

The backend is ready, but your **Android app** needs to:

#### 1. **Add Firebase Messaging SDK**

Add to `app/build.gradle`:
```gradle
dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.3.1'
}
```

#### 2. **Request Notification Permission** (Android 13+)

```kotlin
// In your MainActivity or login screen
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 101)
}
```

#### 3. **Get FCM Token and Register It**

```kotlin
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (task.isSuccessful) {
        val fcmToken = task.result

        // Call your Cloud Function
        val functions = Firebase.functions
        val data = hashMapOf("fcmToken" to fcmToken)

        functions.getHttpsCallable("registerFCMToken")
            .call(data)
            .addOnSuccessListener {
                Log.d("FCM", "Token registered successfully")
            }
            .addOnFailureListener { e ->
                Log.e("FCM", "Failed to register token", e)
            }
    }
}
```

#### 4. **Create FirebaseMessagingService**

Create `MyFirebaseMessagingService.kt`:
```kotlin
class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        // Handle notification
        val data = remoteMessage.data
        val type = data["type"]

        if (type == "order_status_update") {
            val orderId = data["orderId"]
            val orderNumber = data["orderNumber"]
            val status = data["status"]
            val title = remoteMessage.notification?.title ?: "Order Update"
            val body = remoteMessage.notification?.body ?: "Your order has been updated"

            // Show notification
            showNotification(title, body, orderId)
        }
    }

    override fun onNewToken(token: String) {
        // Token refreshed, update Firestore
        // Call registerFCMToken again with new token
    }

    private fun showNotification(title: String, body: String, orderId: String?) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create notification channel (Android 8.0+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "order_updates",
                "Order Updates",
                NotificationManager.IMPORTANCE_HIGH
            )
            notificationManager.createNotificationChannel(channel)
        }

        // Build notification
        val notification = NotificationCompat.Builder(this, "order_updates")
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(orderId.hashCode(), notification)
    }
}
```

#### 5. **Register Service in AndroidManifest.xml**

```xml
<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

#### 6. **Handle Logout**

When user logs out:
```kotlin
val functions = Firebase.functions
functions.getHttpsCallable("removeFCMToken")
    .call()
    .addOnSuccessListener {
        Log.d("FCM", "Token removed successfully")
    }
```

---

## Testing Push Notifications

### Method 1: Using Firebase Console (Quick Test)

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Enter your FCM token (get from Android logs)
6. Click "Test"

### Method 2: Using Your Backend (Real Test)

1. **Get a user's FCM token:**
   ```javascript
   const db = admin.firestore();
   const userDoc = await db.collection('users').doc('USER_ID').get();
   console.log('FCM Token:', userDoc.data().fcmToken);
   ```

2. **Trigger an order status change:**
   - Update an order status to `ready` in Firestore
   - The `onOrderStatusChanged` function will automatically fire
   - Check Firebase Functions logs for success/errors

3. **Check logs:**
   ```bash
   firebase functions:log
   ```

   Look for:
   ```
   ✅ "Successfully sent push notification to user USER_ID"
   ✅ "Push notification and Firestore document created for order ORD-001"
   ```

### Method 3: Using curl (Advanced)

```bash
# Get access token
ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

# Send notification
curl -X POST \
  "https://fcm.googleapis.com/v1/projects/fast-food-manager-b1f54/messages:send" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "USER_FCM_TOKEN",
      "data": {
        "type": "order_status_update",
        "orderId": "test123",
        "orderNumber": "TEST-001",
        "status": "ready",
        "rejectionReason": ""
      },
      "notification": {
        "title": "Commande prête!",
        "body": "Votre commande TEST-001 est prête! Venez la récupérer."
      },
      "android": {
        "priority": "high"
      }
    }
  }'
```

---

## Database Schema Changes

### Before (Old Schema)
```javascript
users/{userId}/
  ├─ username: "john_doe"
  ├─ name: "John Doe"
  └─ role: "client"
  // No FCM token field
```

### After (New Schema)
```javascript
users/{userId}/
  ├─ username: "john_doe"
  ├─ name: "John Doe"
  ├─ role: "client"
  ├─ fcmToken: "eXaMpLeToKeN123..."         // ✅ NEW
  └─ fcmTokenUpdatedAt: Timestamp            // ✅ NEW
```

---

## Order Status Notification Matrix

| Order Status        | Send Notification? | Notification Title         | Who Gets It? |
|---------------------|-------------------|---------------------------|--------------|
| `awaiting_approval` | ❌ No              | -                          | -            |
| `pending`           | ❌ No              | -                          | -            |
| `preparing`         | ✅ Yes             | "Préparation en cours"     | Client       |
| `ready`             | ✅ Yes             | "Commande prête!"          | Client       |
| `completed`         | ✅ Yes             | "Merci!"                   | Client       |
| `rejected`          | ✅ Yes             | "Commande refusée"         | Client       |

---

## Error Handling

### Automatic Token Cleanup
If an FCM token is invalid or expired:
1. ✅ Error is caught and logged
2. ✅ Token is automatically removed from Firestore
3. ✅ User will need to login again to re-register token

### Common Errors and Solutions

| Error Code | Cause | Solution |
|-----------|-------|----------|
| `messaging/registration-token-not-registered` | Token expired or app uninstalled | User needs to login again |
| `messaging/invalid-registration-token` | Malformed token | Check token format |
| `messaging/quota-exceeded` | Too many messages sent | Wait or contact Firebase support |
| `authentication-error` | Invalid service account | Check Firebase credentials |

---

## Deployment

### Deploy to Firebase

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

This will deploy:
- ✅ `registerFCMToken` - Token registration
- ✅ `removeFCMToken` - Token removal
- ✅ `onOrderStatusChanged` - Automatic notifications

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

## API Reference

### Cloud Functions

#### `registerFCMToken(fcmToken: string)`
**Purpose:** Register user's FCM token for push notifications
**Auth:** Required
**Parameters:**
- `fcmToken` (string, required) - FCM registration token from Android SDK

**Response:**
```json
{
  "success": true,
  "message": "FCM token registered successfully"
}
```

**Example Call (JavaScript):**
```javascript
const functions = firebase.functions();
const result = await functions.httpsCallable('registerFCMToken')({
  fcmToken: 'eXaMpLeToKeN123...'
});
```

#### `removeFCMToken()`
**Purpose:** Remove user's FCM token (e.g., on logout)
**Auth:** Required
**Parameters:** None

**Response:**
```json
{
  "success": true,
  "message": "FCM token removed successfully"
}
```

---

## Security Considerations

### ✅ What's Secure
- Users can only update their own FCM tokens (Firestore rules)
- Token registration requires authentication
- Invalid tokens are automatically cleaned up
- Service account credentials are not exposed

### 🔒 Best Practices
1. **Never log FCM tokens** in production (they're sensitive)
2. **Remove tokens on logout** (call `removeFCMToken`)
3. **Handle token refresh** (implement `onNewToken` in Android)
4. **Validate user IDs** before sending notifications

---

## What's Different from the Original Guide

### ✅ Kept from Guide
- FCM initialization with Firebase Admin SDK
- Helper functions for notification titles/bodies
- Token registration and removal functions
- Automatic error handling and token cleanup
- Security rules for token access

### ✅ Adapted for Your System
- Integrated with existing Cloud Functions structure
- Works with your existing order status flow
- Replaced separate `onOrderApproved` and `onOrderCompleted` with unified `onOrderStatusChanged`
- Uses your Firestore database structure (`users`, `orders`, `notifications`)
- Maintains existing WebSocket notifications (both systems work together)

### ✅ Improvements Made
- Consolidated notification logic into single trigger function
- Automatic invalid token cleanup
- Creates both push notifications AND Firestore documents
- Supports rejection reasons in notifications
- More comprehensive error handling

---

## Monitoring and Debugging

### Check Firebase Functions Logs
```bash
firebase functions:log --only onOrderStatusChanged
```

### Check if User Has Token
```bash
firebase firestore:get users/USER_ID
```

Look for:
```json
{
  "fcmToken": "eXaMpLeToKeN123...",
  "fcmTokenUpdatedAt": "2025-01-24T10:30:00Z"
}
```

### Test Notification Sending
```bash
firebase functions:shell
```

Then:
```javascript
const testData = {
  userId: 'USER_ID',
  orderId: 'order123',
  orderNumber: 'TEST-001',
  status: 'ready'
};

sendOrderStatusNotification(
  testData.userId,
  testData.orderId,
  testData.orderNumber,
  testData.status
);
```

---

## Next Steps

1. ✅ **Backend Complete** - All Firebase Cloud Functions are ready
2. 🔴 **Android App** - Implement FCM token registration (see instructions above)
3. 🔴 **Testing** - Test end-to-end notification flow
4. 🔴 **UI/UX** - Design notification UI in Android app
5. 🔴 **Production** - Deploy to production and monitor

---

## Support and Resources

- **Firebase FCM Documentation:** https://firebase.google.com/docs/cloud-messaging
- **Android FCM Setup:** https://firebase.google.com/docs/cloud-messaging/android/client
- **Firebase Console:** https://console.firebase.google.com/project/fast-food-manager-b1f54

---

**Implementation Date:** January 24, 2025
**Status:** Backend Complete, Android Integration Pending
**Version:** 1.0
