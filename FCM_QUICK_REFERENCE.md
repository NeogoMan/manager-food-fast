# FCM Push Notifications - Quick Reference Card

## 🚀 Quick Start

### Deploy Backend
```bash
firebase deploy --only functions,firestore:rules
```

### Android App (5 Steps)
1. Add to `app/build.gradle`:
   ```gradle
   implementation 'com.google.firebase:firebase-messaging:23.3.1'
   ```

2. Get FCM token and register:
   ```kotlin
   FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
       val token = task.result
       Firebase.functions.getHttpsCallable("registerFCMToken")
           .call(hashMapOf("fcmToken" to token))
   }
   ```

3. Create `MyFirebaseMessagingService.kt` (see full implementation guide)

4. Add to `AndroidManifest.xml`:
   ```xml
   <service android:name=".MyFirebaseMessagingService">
       <intent-filter>
           <action android:name="com.google.firebase.MESSAGING_EVENT" />
       </intent-filter>
   </service>
   ```

5. On logout:
   ```kotlin
   Firebase.functions.getHttpsCallable("removeFCMToken").call()
   ```

---

## 📋 API Reference

### `registerFCMToken({ fcmToken: string })`
**Auth:** Required
**Use:** Save user's FCM token on login/startup

```javascript
const result = await functions.httpsCallable('registerFCMToken')({
  fcmToken: 'eXaMpLeToKeN123...'
});
```

### `removeFCMToken()`
**Auth:** Required
**Use:** Remove token on logout

```javascript
await functions.httpsCallable('removeFCMToken')();
```

### `onOrderStatusChanged` (automatic)
**Trigger:** Order status update in Firestore
**Sends notification for:** `preparing`, `ready`, `completed`, `rejected`

---

## 🔔 Notification Types

| Status | Title | Message |
|--------|-------|---------|
| `preparing` | "Préparation en cours" | "Votre commande {#} est en cours de préparation." |
| `ready` | "Commande prête!" | "Votre commande {#} est prête! Venez la récupérer." |
| `completed` | "Merci!" | "Votre commande {#} est terminée. Merci de votre visite!" |
| `rejected` | "Commande refusée" | "Désolé, votre commande {#} a été refusée. {reason}" |

---

## 🔍 Testing

### Check User's FCM Token
```bash
firebase firestore:get users/USER_ID
```

### View Function Logs
```bash
firebase functions:log --only onOrderStatusChanged
```

### Test Notification (Firebase Console)
1. Go to: https://console.firebase.google.com/project/fast-food-manager-b1f54/messaging
2. Click "Send your first message"
3. Enter token from Android app logs
4. Send test

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Token not registered" | User needs to login again (token expired) |
| No notification received | Check Android notification permissions |
| Function not triggered | Verify order status changed in Firestore |
| Token is null | Call `registerFCMToken` after login |

---

## 📊 Database Schema

```javascript
users/{userId}/
  ├─ fcmToken: string | null
  └─ fcmTokenUpdatedAt: Timestamp

notifications/{notificationId}/
  ├─ type: "order_status_update"
  ├─ orderId: string
  ├─ orderNumber: string
  ├─ title: string
  ├─ message: string
  ├─ userId: string
  ├─ status: string
  ├─ read: boolean
  └─ createdAt: Timestamp
```

---

## 🔐 Security Rules

Users can update only their own FCM token:
```javascript
allow update: if isOwner(userId) &&
  request.resource.data.diff(resource.data).affectedKeys()
    .hasOnly(['fcmToken', 'fcmTokenUpdatedAt']);
```

---

## 📁 Files Changed

- ✅ `/functions/index.js` - Added FCM functions
- ✅ `/firestore.rules` - Updated user update rules
- ✅ `/PUSH_NOTIFICATIONS_IMPLEMENTATION.md` - Full guide
- ✅ `/CHANGES_SUMMARY.md` - Detailed changes

---

## ⚡ Code Snippets

### Android: Handle Notification Tap
```kotlin
val intent = Intent(this, OrdersActivity::class.java).apply {
    putExtra("orderId", data["orderId"])
    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
}
val pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE)

val notification = NotificationCompat.Builder(this, "order_updates")
    .setContentIntent(pendingIntent)
    // ... other settings
    .build()
```

### Backend: Send Custom Notification (if needed)
```javascript
await sendOrderStatusNotification(
  'userId',
  'orderId',
  'ORD-001',
  'ready',
  null  // rejectionReason
);
```

---

## 📞 Support

- **Full Docs:** `/PUSH_NOTIFICATIONS_IMPLEMENTATION.md`
- **Firebase Console:** https://console.firebase.google.com/project/fast-food-manager-b1f54
- **Firebase FCM Docs:** https://firebase.google.com/docs/cloud-messaging

---

**Last Updated:** January 24, 2025
**Version:** 1.0
