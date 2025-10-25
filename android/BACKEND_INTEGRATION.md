# Backend Integration Guide - Push Notifications

## Overview
This document explains how your backend/admin application should send push notifications to Android app users when order status changes.

---

## Table of Contents
1. [How It Works](#how-it-works)
2. [Prerequisites](#prerequisites)
3. [FCM Token Storage](#fcm-token-storage)
4. [Sending Notifications](#sending-notifications)
5. [Notification Payload Examples](#notification-payload-examples)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## How It Works

```
┌─────────────┐        ┌──────────────┐        ┌─────────────┐        ┌──────────────┐
│   Admin     │        │   Firestore  │        │  Firebase   │        │   Android    │
│     App     │───────▶│   Database   │───────▶│     FCM     │───────▶│     App      │
└─────────────┘        └──────────────┘        └─────────────┘        └──────────────┘
  1. Update             2. Status              3. Send Push          4. Show
     Order Status          Changed                Notification          Notification
```

### Flow
1. **Admin updates order status** in Firestore (`orders/{orderId}`)
2. **Backend/Admin app** detects the change and retrieves user's FCM token
3. **Backend sends** push notification via FCM HTTP API
4. **Android app receives** notification (even when closed)
5. **User taps notification** → App opens to Orders screen

---

## Prerequisites

### 1. Firebase Project Setup
- Access to Firebase Console: https://console.firebase.google.com
- Project: `fast-food-manager` (or your project name)
- Service Account credentials (JSON file)

### 2. Service Account Key
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file securely
4. **Never commit this file to version control!**

### 3. Firebase Admin SDK
Install the Firebase Admin SDK in your backend:

**Node.js:**
```bash
npm install firebase-admin
```

**Python:**
```bash
pip install firebase-admin
```

**Java/Kotlin:**
```gradle
implementation 'com.google.firebase:firebase-admin:9.2.0'
```

---

## FCM Token Storage

### Where Tokens Are Stored
FCM tokens are stored in Firestore under the `users` collection:

```
users/{userId}/
  ├─ fcmToken: "eXaMpLeToKeN123..."
  ├─ email: "user@example.com"
  ├─ name: "John Doe"
  └─ ...other user fields
```

### Retrieving User's FCM Token

**Firestore Query Example (Node.js):**
```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

async function getUserFCMToken(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const fcmToken = userDoc.data().fcmToken;
  if (!fcmToken) {
    console.warn(`User ${userId} does not have an FCM token`);
    return null;
  }

  return fcmToken;
}
```

---

## Sending Notifications

### Method 1: Using Firebase Admin SDK (Recommended)

#### Node.js Example
```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin (do this once at app startup)
admin.initializeApp({
  credential: admin.credential.cert('./path/to/serviceAccountKey.json')
});

/**
 * Send order status notification to user
 */
async function sendOrderStatusNotification(userId, orderId, orderNumber, newStatus, rejectionReason = null) {
  try {
    // Get user's FCM token
    const fcmToken = await getUserFCMToken(userId);
    if (!fcmToken) {
      console.log(`No FCM token for user ${userId}, skipping notification`);
      return;
    }

    // Build notification message
    const message = {
      token: fcmToken,
      data: {
        type: 'order_status_update',
        orderId: orderId,
        orderNumber: orderNumber,
        status: newStatus.toLowerCase(),
        rejectionReason: rejectionReason || ''
      },
      // Optional: Add notification payload for when app is in background
      notification: {
        title: getNotificationTitle(newStatus),
        body: getNotificationBody(orderNumber, newStatus, rejectionReason)
      },
      // High priority for immediate delivery
      android: {
        priority: 'high'
      }
    };

    // Send message
    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);

    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Get notification title based on order status
 */
function getNotificationTitle(status) {
  const titles = {
    'preparing': 'Préparation en cours',
    'ready': 'Commande prête!',
    'completed': 'Merci!',
    'rejected': 'Commande refusée'
  };
  return titles[status.toLowerCase()] || 'Mise à jour de commande';
}

/**
 * Get notification body based on order status
 */
function getNotificationBody(orderNumber, status, rejectionReason) {
  const messages = {
    'preparing': `Votre commande ${orderNumber} est en cours de préparation.`,
    'ready': `Votre commande ${orderNumber} est prête! Venez la récupérer.`,
    'completed': `Votre commande ${orderNumber} est terminée. Merci de votre visite!`,
    'rejected': `Désolé, votre commande ${orderNumber} a été refusée. ${rejectionReason || ''}`
  };
  return messages[status.toLowerCase()] || `Votre commande ${orderNumber} a été mise à jour.`;
}
```

#### Python Example
```python
import firebase_admin
from firebase_admin import credentials, firestore, messaging

# Initialize Firebase Admin
cred = credentials.Certificate('./path/to/serviceAccountKey.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

def send_order_status_notification(user_id, order_id, order_number, new_status, rejection_reason=None):
    """Send order status notification to user"""
    try:
        # Get user's FCM token
        user_doc = db.collection('users').document(user_id).get()
        if not user_doc.exists:
            print(f"User {user_id} not found")
            return None

        fcm_token = user_doc.to_dict().get('fcmToken')
        if not fcm_token:
            print(f"No FCM token for user {user_id}")
            return None

        # Build message
        message = messaging.Message(
            token=fcm_token,
            data={
                'type': 'order_status_update',
                'orderId': order_id,
                'orderNumber': order_number,
                'status': new_status.lower(),
                'rejectionReason': rejection_reason or ''
            },
            notification=messaging.Notification(
                title=get_notification_title(new_status),
                body=get_notification_body(order_number, new_status, rejection_reason)
            ),
            android=messaging.AndroidConfig(
                priority='high'
            )
        )

        # Send message
        response = messaging.send(message)
        print(f'Successfully sent notification: {response}')
        return response

    except Exception as e:
        print(f'Error sending notification: {e}')
        raise

def get_notification_title(status):
    titles = {
        'preparing': 'Préparation en cours',
        'ready': 'Commande prête!',
        'completed': 'Merci!',
        'rejected': 'Commande refusée'
    }
    return titles.get(status.lower(), 'Mise à jour de commande')

def get_notification_body(order_number, status, rejection_reason):
    messages = {
        'preparing': f'Votre commande {order_number} est en cours de préparation.',
        'ready': f'Votre commande {order_number} est prête! Venez la récupérer.',
        'completed': f'Votre commande {order_number} est terminée. Merci de votre visite!',
        'rejected': f'Désolé, votre commande {order_number} a été refusée. {rejection_reason or ""}'
    }
    return messages.get(status.lower(), f'Votre commande {order_number} a été mise à jour.')
```

### Method 2: Using FCM HTTP v1 API (Direct HTTP)

```bash
# Get access token first
ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

# Send notification
curl -X POST \
  "https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "USER_FCM_TOKEN",
      "data": {
        "type": "order_status_update",
        "orderId": "order123",
        "orderNumber": "ORD-001",
        "status": "ready",
        "rejectionReason": ""
      },
      "notification": {
        "title": "Commande prête!",
        "body": "Votre commande ORD-001 est prête! Venez la récupérer."
      },
      "android": {
        "priority": "high"
      }
    }
  }'
```

---

## Notification Payload Examples

### Order Status: PREPARING
```json
{
  "token": "eXaMpLeToKeN123...",
  "data": {
    "type": "order_status_update",
    "orderId": "abc123xyz",
    "orderNumber": "ORD-042",
    "status": "preparing",
    "rejectionReason": ""
  },
  "notification": {
    "title": "Préparation en cours",
    "body": "Votre commande ORD-042 est en cours de préparation."
  }
}
```

### Order Status: READY
```json
{
  "token": "eXaMpLeToKeN123...",
  "data": {
    "type": "order_status_update",
    "orderId": "abc123xyz",
    "orderNumber": "ORD-042",
    "status": "ready",
    "rejectionReason": ""
  },
  "notification": {
    "title": "Commande prête!",
    "body": "Votre commande ORD-042 est prête! Venez la récupérer."
  }
}
```

### Order Status: REJECTED
```json
{
  "token": "eXaMpLeToKeN123...",
  "data": {
    "type": "order_status_update",
    "orderId": "abc123xyz",
    "orderNumber": "ORD-042",
    "status": "rejected",
    "rejectionReason": "Ingrédient manquant"
  },
  "notification": {
    "title": "Commande refusée",
    "body": "Désolé, votre commande ORD-042 a été refusée. Ingrédient manquant"
  }
}
```

---

## Integration Example: Order Status Update Flow

### Complete Backend Flow (Node.js)

```javascript
/**
 * Update order status and send notification
 * Call this when admin changes order status
 */
async function updateOrderStatus(orderId, newStatus, rejectionReason = null) {
  try {
    // 1. Get order details
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new Error('Order not found');
    }

    const order = orderDoc.data();
    const userId = order.userId;
    const orderNumber = order.orderNumber;

    // 2. Update order status in Firestore
    await db.collection('orders').doc(orderId).update({
      status: newStatus.toLowerCase(),
      rejectionReason: rejectionReason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Order ${orderId} status updated to ${newStatus}`);

    // 3. Send push notification to user
    await sendOrderStatusNotification(
      userId,
      orderId,
      orderNumber,
      newStatus,
      rejectionReason
    );

    console.log(`Notification sent to user ${userId}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

// Usage example
updateOrderStatus('abc123xyz', 'READY')
  .then(() => console.log('Order updated and notification sent'))
  .catch(error => console.error('Error:', error));
```

---

## Testing

### 1. Test FCM Token Retrieval
```javascript
// Test if user has FCM token
const userId = 'test_user_id';
const token = await getUserFCMToken(userId);
console.log('FCM Token:', token);
```

### 2. Test Notification Sending
```javascript
// Test sending notification
await sendOrderStatusNotification(
  'test_user_id',
  'test_order_id',
  'TEST-001',
  'READY'
);
```

### 3. Expected Result
- ✅ User receives notification on Android device
- ✅ Notification appears even if app is closed
- ✅ Tapping notification opens app to Orders screen
- ✅ Order status is updated in real-time

---

## Troubleshooting

### User Not Receiving Notifications

**1. Check FCM Token Exists**
```javascript
const token = await getUserFCMToken(userId);
console.log('Token exists:', !!token);
```

**2. Check Token Validity**
```javascript
try {
  await admin.messaging().send({
    token: token,
    data: { test: 'true' }
  });
  console.log('Token is valid');
} catch (error) {
  console.error('Token is invalid:', error);
  // Token may have expired, user needs to login again
}
```

**3. Check Firebase Cloud Messaging API is Enabled**
- Go to Firebase Console → APIs & Services
- Enable "Firebase Cloud Messaging API"

**4. Verify Service Account Permissions**
- Service account must have "Firebase Cloud Messaging API Admin" role

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `registration-token-not-registered` | Token expired or app uninstalled | User needs to login again to generate new token |
| `invalid-argument` | Malformed token or payload | Check token format and payload structure |
| `quota-exceeded` | FCM quota limit reached | Contact Firebase support to increase quota |
| `authentication-error` | Invalid service account credentials | Verify serviceAccountKey.json is correct |

---

## Best Practices

1. **Error Handling**: Always wrap FCM calls in try-catch
2. **Token Refresh**: Handle expired tokens gracefully
3. **Batch Notifications**: Use FCM batch sending for multiple users
4. **Rate Limiting**: Respect FCM rate limits (1 million messages/project/day free tier)
5. **Logging**: Log all notification attempts for debugging
6. **Privacy**: Never log full FCM tokens in production
7. **Testing**: Test on real devices, not emulators (FCM works best on real devices)

---

## Support

For issues with:
- **Android App**: Contact Android development team
- **FCM Configuration**: Check Firebase Console logs
- **Backend Integration**: Refer to Firebase Admin SDK docs

**Firebase Documentation:**
- FCM Server Reference: https://firebase.google.com/docs/cloud-messaging/server
- Admin SDK: https://firebase.google.com/docs/admin/setup

---

## Quick Reference

### Order Status Values
- `AWAITING_APPROVAL` - Order received, waiting for approval
- `PENDING` - Order approved, not yet started
- `PREPARING` - Order is being prepared ✅ **Send notification**
- `READY` - Order is ready for pickup ✅ **Send notification**
- `COMPLETED` - Order completed ✅ **Send notification**
- `REJECTED` - Order rejected ✅ **Send notification**

### Notification Types
- `order_status_update` - Status change notification (main type)
- `order_confirmation` - Order received confirmation

---

**Last Updated:** 2025-01-24
**Version:** 1.0
**Contact:** Development Team
