# Multi-Tenant Database Schema

## Overview
This document defines the database schema for converting the restaurant management system into a multi-tenant SaaS platform.

## Collections Structure

### 1. `restaurants` Collection

Main collection for storing restaurant tenant information.

```javascript
{
  // Unique identifier for the restaurant (auto-generated)
  restaurantId: "rest_abc123xyz",

  // Basic Information
  name: "Joe's Burgers",
  email: "owner@joesburgers.com",
  phone: "+1234567890",
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  },
  timezone: "America/New_York",
  currency: "USD",

  // Subscription & Billing
  plan: "pro", // "basic" | "pro" | "enterprise"
  status: "active", // "active" | "suspended" | "cancelled" | "trial"
  billing: {
    stripeCustomerId: "cus_xxx",
    subscriptionId: "sub_xxx",
    currentPeriodStart: Timestamp,
    currentPeriodEnd: Timestamp,
    cancelAtPeriodEnd: false,
    trialEndsAt: Timestamp | null
  },

  // Feature Flags (based on plan)
  features: {
    analyticsEnabled: true,        // Pro+
    mobileAppEnabled: true,         // Pro+
    multiLocationEnabled: false,    // Enterprise only
    customBrandingEnabled: false,   // Enterprise only
    apiAccessEnabled: false,        // Enterprise only
    prioritySupportEnabled: true,   // Pro+
    maxStaffUsers: 10,             // Basic: 3, Pro: unlimited (-1), Enterprise: unlimited
    maxOrders: -1                  // -1 = unlimited
  },

  // Branding (Enterprise feature)
  branding: {
    logoUrl: "https://storage.googleapis.com/...",
    primaryColor: "#FF5722",
    secondaryColor: "#FFC107",
    accentColor: "#4CAF50",
    customDomain: null // "orders.joesburgers.com"
  },

  // Usage Statistics
  usage: {
    totalOrders: 0,
    totalRevenue: 0,
    activeStaffUsers: 1,
    storageUsedMB: 0,
    lastActivityAt: Timestamp
  },

  // Metadata
  createdAt: Timestamp,
  createdBy: "userId", // First admin user
  updatedAt: Timestamp,
  updatedBy: "userId",

  // Onboarding
  onboardingCompleted: true,
  setupStep: "completed" // "profile" | "menu" | "users" | "completed"
}
```

### 2. Updated `users` Collection

Add `restaurantId` to isolate users by tenant.

```javascript
{
  userId: "auto-generated-id",
  restaurantId: "rest_abc123xyz", // NEW FIELD - Required for all users

  // Existing fields
  username: "john_manager",
  passwordHash: "bcrypt-hash",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  role: "manager", // "manager" | "cashier" | "cook" | "client"

  // Super Admin flag (for platform management)
  isSuperAdmin: false, // NEW FIELD - Only for platform owners

  // Existing fields
  status: "active",
  fcmToken: "fcm-token-xxx",
  fcmTokenUpdatedAt: Timestamp,
  createdAt: Timestamp,
  createdBy: "userId",
  lastLogin: Timestamp,
  updatedAt: Timestamp
}
```

### 3. Updated `orders` Collection

Add `restaurantId` for multi-tenant filtering.

```javascript
{
  orderId: "auto-generated-id",
  restaurantId: "rest_abc123xyz", // NEW FIELD - Required

  // Existing fields
  orderNumber: "ORD-001",
  userId: "client-user-id",
  customerName: "Jane Customer",
  items: [...],
  total: 25.99,
  status: "pending",
  notes: "",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  // ... other existing fields
}
```

### 4. Updated `menu` / `menu_items` Collection

Add `restaurantId` for menu isolation.

```javascript
{
  itemId: "auto-generated-id",
  restaurantId: "rest_abc123xyz", // NEW FIELD - Required

  // Existing fields
  name: "Classic Burger",
  description: "Juicy beef patty with cheese",
  price: 8.99,
  category: "Burgers",
  imageUrl: "https://...",
  is_available: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 5. Updated `notifications` Collection

Add `restaurantId` for notification isolation.

```javascript
{
  notificationId: "auto-generated-id",
  restaurantId: "rest_abc123xyz", // NEW FIELD - Required

  // Existing fields
  type: "order_status_update",
  orderId: "order-id",
  userId: "user-id",
  title: "Order Ready!",
  message: "Your order #123 is ready",
  read: false,
  createdAt: Timestamp
}
```

### 6. Updated `carts` Collection

Add `restaurantId` for cart isolation.

```javascript
{
  userId: "user-id",
  restaurantId: "rest_abc123xyz", // NEW FIELD - Required

  // Existing cart items
  items: [...],
  updatedAt: Timestamp
}
```

### 7. New `subscriptionEvents` Collection (Optional - for audit trail)

Track subscription changes over time.

```javascript
{
  eventId: "auto-generated-id",
  restaurantId: "rest_abc123xyz",
  eventType: "subscription_created", // created | upgraded | downgraded | cancelled | renewed
  previousPlan: "basic",
  newPlan: "pro",
  triggeredBy: "userId" | "stripe_webhook",
  metadata: {
    // Additional event-specific data
  },
  createdAt: Timestamp
}
```

## Firestore Indexes Required

Add these composite indexes to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "role", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "menu",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "restaurants",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## Migration Strategy

1. **Create default restaurant**: Insert a default restaurant document for existing data
2. **Add restaurantId to all collections**: Run migration script to populate restaurantId
3. **Update application code**: Modify all queries to filter by restaurantId
4. **Deploy security rules**: Enable tenant isolation at database level
5. **Test thoroughly**: Ensure data isolation works correctly

## Plan Limits Summary

| Feature | Basic | Pro | Enterprise |
|---------|-------|-----|------------|
| Price/month | $29 | $79 | $199 |
| Staff Users | 3 | Unlimited | Unlimited |
| Client Mobile App | ❌ | ✅ | ✅ |
| Analytics & Reports | ❌ | ✅ | ✅ |
| Multi-Location | ❌ | ❌ | ✅ |
| Custom Branding | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Support | Email | Priority Email | Dedicated |

## Next Steps

1. Update `firestore.indexes.json` with composite indexes
2. Update `firestore.rules` with multi-tenant security
3. Modify Cloud Functions to handle `restaurantId`
4. Create migration script
5. Update frontend/Android to use `restaurantId`
