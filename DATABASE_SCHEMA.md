# Database Schema - Firestore Collections

## Table of Contents
- [Overview](#overview)
- [Collections](#collections)
  - [restaurants](#restaurants-collection)
  - [users](#users-collection)
  - [super_admins](#super_admins-collection)
  - [orders](#orders-collection)
  - [menu / menu_items](#menu--menu_items-collection)
  - [carts](#carts-collection)
  - [notifications](#notifications-collection)
  - [audit_logs](#audit_logs-collection)
- [Subcollections](#subcollections)
- [Indexes](#indexes)
- [Relationships](#relationships)

## Overview

The database uses **Cloud Firestore**, a NoSQL document database with the following characteristics:
- **Collections**: Top-level containers for documents
- **Documents**: JSON-like objects with fields
- **Subcollections**: Collections nested within documents
- **Real-time**: Changes propagate to listeners instantly
- **Scalable**: Auto-scales to handle traffic

### Multi-Tenancy Strategy
- **Model**: Shared database with logical isolation
- **Tenant ID**: `restaurantId` field in all documents
- **Isolation**: Enforced by Firestore security rules
- **Queries**: Always filter by `restaurantId` (except super admin)

## Collections

### `restaurants` Collection

**Purpose**: Store restaurant (tenant) information

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  // Basic Information
  name: string,                    // "Joe's Burgers"
  shortCode: string,               // "BURGER01" (6-8 chars, unique)
  email: string,                   // "owner@joesburgers.com"
  phone: string,                   // "+1234567890"
  address: string | null,          // Physical address
  description: string | null,      // About the restaurant

  // Status & Plan
  status: string,                  // "active" | "suspended" | "trial"
  plan: string,                    // "basic" | "pro" | "enterprise"
  acceptingOrders: boolean,        // true = guest orders enabled

  // Branding
  branding: {
    logoUrl: string | null,
    primaryColor: string,          // "#FF5722"
    secondaryColor: string,        // "#FFC107"
    accentColor: string,           // "#4CAF50"
    fontFamily: string | null
  },

  // Billing
  billing: {
    currentPeriodStart: Timestamp,
    currentPeriodEnd: Timestamp,
    cancelAtPeriodEnd: boolean,
    stripeCustomerId: string | null,
    stripeSubscriptionId: string | null
  },

  // Features (Plan-based)
  features: {
    analyticsEnabled: boolean,
    mobileAppEnabled: boolean,
    multiLocationEnabled: boolean,
    customBrandingEnabled: boolean,
    maxStaffUsers: number,         // -1 = unlimited
    maxMenuItems: number,          // -1 = unlimited
    maxOrdersPerMonth: number      // -1 = unlimited
  },

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string | null,        // Super admin user ID
  lastModifiedBy: string | null
}
```

**Indexes**:
- `shortCode` (ascending) - Unique index
- `status` + `plan` (composite)
- `createdAt` (descending)

**Example**:
```javascript
{
  id: "rest_abc123xyz",
  name: "Joe's Burgers",
  shortCode: "BURGER01",
  email: "joe@joesburgers.com",
  phone: "+12125551234",
  status: "active",
  plan: "pro",
  acceptingOrders: true,
  branding: {
    logoUrl: "https://storage.googleapis.com/...",
    primaryColor: "#FF5722",
    secondaryColor: "#FFC107",
    accentColor: "#4CAF50"
  },
  features: {
    analyticsEnabled: true,
    maxStaffUsers: -1,
    maxMenuItems: -1
  },
  createdAt: Timestamp(2025, 1, 1, 10, 0, 0),
  updatedAt: Timestamp(2025, 1, 15, 14, 30, 0)
}
```

---

### `users` Collection

**Purpose**: Store restaurant users (managers, cashiers, cooks, clients)

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  // Multi-Tenant Association
  restaurantId: string,            // Primary restaurant ID
  restaurantIds: string[],         // Array for multi-restaurant support
  activeRestaurantId: string,      // Currently active restaurant

  // Authentication
  username: string,                // Unique within restaurant
  passwordHash: string,            // Bcrypt hash

  // Profile
  name: string,                    // "John Doe"
  email: string | null,
  phone: string | null,            // "+1234567890"
  avatar: string | null,           // URL to profile image

  // Authorization
  role: string,                    // "manager" | "cashier" | "cook" | "client"
  permissions: string[] | null,    // Custom permissions array
  isSuperAdmin: boolean,           // false for regular users

  // Status
  status: string,                  // "active" | "inactive" | "suspended"

  // Push Notifications
  fcmToken: string | null,         // Firebase Cloud Messaging token
  fcmTokenUpdatedAt: Timestamp | null,

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLogin: Timestamp | null,
  createdBy: string | null         // User ID who created this user
}
```

**Indexes**:
- `restaurantId` + `role` (composite)
- `restaurantId` + `username` (composite, unique)
- `restaurantId` + `status` (composite)
- `phone` + `restaurantId` (composite, for client lookup)
- `username` (ascending, for super admin multi-restaurant)

**Example - Manager**:
```javascript
{
  id: "user_manager123",
  restaurantId: "rest_abc123xyz",
  restaurantIds: ["rest_abc123xyz"],
  activeRestaurantId: "rest_abc123xyz",
  username: "john_manager",
  passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz",
  name: "John Doe",
  email: "john@joesburgers.com",
  phone: "+12125551234",
  role: "manager",
  status: "active",
  fcmToken: "token_abc123...",
  createdAt: Timestamp(2025, 1, 1, 10, 0, 0),
  lastLogin: Timestamp(2025, 1, 15, 9, 30, 0)
}
```

**Example - Client**:
```javascript
{
  id: "user_client456",
  restaurantId: "rest_abc123xyz",
  restaurantIds: ["rest_abc123xyz"],
  activeRestaurantId: "rest_abc123xyz",
  username: "client_1234_5678",   // Auto-generated
  passwordHash: "$2b$10$...",
  name: "Jane Smith",
  phone: "+12125555678",
  role: "client",
  status: "active",
  fcmToken: "token_xyz789...",
  createdAt: Timestamp(2025, 1, 10, 14, 0, 0)
}
```

---

### `super_admins` Collection

**Purpose**: Store platform super administrator accounts

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  // Authentication
  username: string,                // Unique platform-wide
  passwordHash: string,            // Bcrypt hash

  // Profile
  name: string,
  email: string,
  phone: string | null,

  // Status
  status: string,                  // "active" | "inactive"

  // Security
  loginAttempts: number,           // Failed login counter
  lastLoginAt: Timestamp | null,
  lastFailedLoginAt: Timestamp | null,
  lockedUntil: Timestamp | null,   // Account lockout

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp | null
}
```

**Example**:
```javascript
{
  id: "superadmin_001",
  username: "platform_admin",
  passwordHash: "$2b$10$...",
  name: "Platform Administrator",
  email: "admin@platform.com",
  phone: "+12125550000",
  status: "active",
  loginAttempts: 0,
  lastLoginAt: Timestamp(2025, 1, 15, 8, 0, 0),
  createdAt: Timestamp(2024, 12, 1, 10, 0, 0)
}
```

---

### `orders` Collection

**Purpose**: Store all orders (staff-created, client-placed, guest QR orders)

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  // Multi-Tenant
  restaurantId: string,

  // Order Identification
  orderNumber: string,             // "0847" (4-digit random) or timestamp-based

  // Order Source
  isGuestOrder: boolean,           // true for QR code orders
  userId: string | null,           // null for staff orders, set for client/guest

  // Guest Information (if isGuestOrder = true)
  guestName: string | null,
  guestPhone: string | null,
  trackingSecret: string | null,   // UUID for order tracking
  tableNumber: string | null,      // "5" or null
  orderType: string | null,        // "dine-in" | "takeout" | "pickup"

  // Customer Info (for all orders)
  customerName: string,            // Display name
  customerPhone: string | null,

  // Order Items
  items: [
    {
      menuItemId: string,
      name: string,
      price: number,
      quantity: number,
      subtotal: number,            // price * quantity
      notes: string | null         // "No onions"
    }
  ],
  itemCount: number,               // Total quantity sum
  totalAmount: number,             // Final total
  notes: string | null,            // Order-level notes (max 50 chars for guests)

  // Status Management
  status: string,                  // "awaiting_approval" | "pending" | "preparing" | "ready" | "completed" | "cancelled" | "rejected"

  // Payment
  paymentStatus: string,           // "unpaid" | "paid"
  paymentAmount: number | null,
  changeGiven: number | null,
  paymentMethod: string | null,    // "cash" | "card" | "mobile"
  paymentTime: Timestamp | null,
  paidBy: string | null,           // User ID

  // Approval/Rejection (for guest orders)
  approvedBy: string | null,       // User ID
  approvedByName: string | null,
  approvedAt: Timestamp | null,
  rejectedBy: string | null,
  rejectionReason: string | null,  // "Out of stock"

  // Edit History (for staff order edits)
  editHistory: [
    {
      editedBy: string,            // User ID
      editedByName: string,
      editedAt: Timestamp,
      previousItems: [...],        // Snapshot before edit
      previousTotal: number,
      reason: string | null
    }
  ] | null,

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string | null,        // User ID (for staff orders)
  statusHistory: [                 // Optional: track status changes
    {
      status: string,
      changedBy: string,
      changedAt: Timestamp
    }
  ] | null
}
```

**Indexes**:
- `restaurantId` + `status` + `createdAt` (composite, descending)
- `restaurantId` + `userId` (composite)
- `restaurantId` + `isGuestOrder` (composite)
- `restaurantId` + `orderNumber` (composite, unique)
- `restaurantId` + `createdAt` (composite, descending)
- `userId` + `createdAt` (composite, for client order history)

**Example - Guest Order**:
```javascript
{
  id: "order_guest789",
  restaurantId: "rest_abc123xyz",
  orderNumber: "0847",

  isGuestOrder: true,
  userId: null,
  guestName: "Jane Smith",
  guestPhone: "+12125555678",
  trackingSecret: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  tableNumber: "5",
  orderType: "dine-in",

  customerName: "Jane Smith",

  items: [
    {
      menuItemId: "menu_burger001",
      name: "Classic Burger",
      price: 8.99,
      quantity: 2,
      subtotal: 17.98,
      notes: "No onions"
    },
    {
      menuItemId: "menu_fries001",
      name: "French Fries",
      price: 3.99,
      quantity: 1,
      subtotal: 3.99
    }
  ],
  itemCount: 3,
  totalAmount: 21.97,
  notes: "Extra napkins please",

  status: "pending",
  paymentStatus: "unpaid",

  approvedBy: "user_manager123",
  approvedByName: "John Doe",
  approvedAt: Timestamp(2025, 1, 15, 12, 5, 0),

  createdAt: Timestamp(2025, 1, 15, 12, 0, 0),
  updatedAt: Timestamp(2025, 1, 15, 12, 5, 0)
}
```

**Example - Client Order**:
```javascript
{
  id: "order_client321",
  restaurantId: "rest_abc123xyz",
  orderNumber: "1234",

  isGuestOrder: false,
  userId: "user_client456",

  customerName: "Jane Smith",
  customerPhone: "+12125555678",

  items: [...],
  itemCount: 2,
  totalAmount: 15.50,

  status: "preparing",
  paymentStatus: "paid",
  paymentAmount: 20.00,
  changeGiven: 4.50,
  paymentMethod: "cash",

  createdAt: Timestamp(2025, 1, 15, 13, 0, 0),
  updatedAt: Timestamp(2025, 1, 15, 13, 10, 0)
}
```

---

### `menu` / `menu_items` Collection

**Purpose**: Store restaurant menu items

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  // Multi-Tenant
  restaurantId: string,

  // Item Information
  name: string,                    // "Classic Burger"
  description: string | null,
  price: number,                   // 8.99
  category: string,                // "Burgers" | "Sides" | "Drinks" | "Desserts"

  // Media
  imageUrl: string | null,         // URL to item image

  // Availability
  isAvailable: boolean,            // true = visible to customers

  // Additional Fields (optional)
  prepTime: number | null,         // Minutes
  calories: number | null,
  allergens: string[] | null,      // ["nuts", "dairy"]
  tags: string[] | null,           // ["spicy", "vegetarian"]

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes**:
- `restaurantId` + `category` (composite)
- `restaurantId` + `isAvailable` (composite)
- `restaurantId` + `createdAt` (composite, descending)

**Example**:
```javascript
{
  id: "menu_burger001",
  restaurantId: "rest_abc123xyz",
  name: "Classic Burger",
  description: "Juicy beef patty with lettuce, tomato, and special sauce",
  price: 8.99,
  category: "Burgers",
  imageUrl: "https://storage.googleapis.com/menu-images/burger001.jpg",
  isAvailable: true,
  prepTime: 15,
  calories: 650,
  allergens: ["gluten"],
  createdAt: Timestamp(2025, 1, 1, 10, 0, 0),
  updatedAt: Timestamp(2025, 1, 10, 14, 30, 0)
}
```

---

### `carts` Collection

**Purpose**: Store shopping carts for clients

**Document ID**: User ID (one cart per user)

**Fields**:
```javascript
{
  // User Association
  userId: string,                  // Same as document ID
  restaurantId: string,

  // Cart Items
  items: [
    {
      menuItemId: string,
      name: string,
      price: number,
      quantity: number,
      addedAt: Timestamp
    }
  ],

  // Metadata
  updatedAt: Timestamp
}
```

**Example**:
```javascript
{
  userId: "user_client456",
  restaurantId: "rest_abc123xyz",
  items: [
    {
      menuItemId: "menu_burger001",
      name: "Classic Burger",
      price: 8.99,
      quantity: 2,
      addedAt: Timestamp(2025, 1, 15, 11, 30, 0)
    }
  ],
  updatedAt: Timestamp(2025, 1, 15, 11, 35, 0)
}
```

---

### `notifications` Collection

**Purpose**: Store user notifications

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  // Targeting
  restaurantId: string,
  userId: string,                  // Recipient user ID

  // Notification Type
  type: string,                    // "order_approved" | "order_status_update" | "order_ready" | "payment_received"

  // Related Data
  orderId: string | null,
  orderNumber: string | null,

  // Content
  title: string,                   // "Order Ready!"
  message: string,                 // "Your order #1234 is ready for pickup"
  status: string | null,           // Order status (if applicable)

  // Media
  imageUrl: string | null,
  actionUrl: string | null,        // Deep link or URL

  // State
  read: boolean,                   // false = unread
  readAt: Timestamp | null,

  // Metadata
  createdAt: Timestamp
}
```

**Indexes**:
- `restaurantId` + `userId` + `createdAt` (composite, descending)
- `userId` + `read` (composite)

**Example**:
```javascript
{
  id: "notif_001",
  restaurantId: "rest_abc123xyz",
  userId: "user_client456",
  type: "order_status_update",
  orderId: "order_client321",
  orderNumber: "1234",
  title: "Order Ready!",
  message: "Your order #1234 is ready for pickup",
  status: "ready",
  read: false,
  createdAt: Timestamp(2025, 1, 15, 13, 15, 0)
}
```

---

### `audit_logs` Collection

**Purpose**: Track super admin actions for security and compliance

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  // Action Type
  type: string,                    // "super_admin_login" | "restaurant_created" | "restaurant_suspended"

  // Actor
  userId: string | null,           // Super admin ID
  username: string | null,

  // Target (if applicable)
  targetType: string | null,       // "restaurant" | "user"
  targetId: string | null,
  targetName: string | null,

  // Result
  success: boolean,
  error: string | null,

  // Request Details
  ipAddress: string | null,
  userAgent: string | null,

  // Additional Data
  metadata: object | null,         // Flexible field for extra info

  // Timestamp
  timestamp: Timestamp
}
```

**Indexes**:
- `type` + `timestamp` (composite, descending)
- `userId` + `timestamp` (composite, descending)

**Example**:
```javascript
{
  id: "audit_001",
  type: "super_admin_login",
  userId: "superadmin_001",
  username: "platform_admin",
  success: true,
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  timestamp: Timestamp(2025, 1, 15, 8, 0, 0)
}
```

---

## Subcollections

### `restaurants/{restaurantId}/settings`

**Purpose**: Store restaurant-specific settings

**Document ID**: Setting category (e.g., "ticket", "printer", "kitchen")

**Example**:
```javascript
// Document: restaurants/rest_abc123xyz/settings/ticket
{
  showLogo: true,
  showAddress: true,
  showPhone: true,
  footerText: "Thank you for your order!",
  fontSize: 12
}

// Document: restaurants/rest_abc123xyz/settings/printer
{
  printerName: "Star TSP143",
  printerType: "USB",
  autoPrint: false
}
```

---

## Indexes

**File**: `firestore.indexes.json`

### Composite Indexes

1. **users** collection:
   - `restaurantId` (ASC) + `role` (ASC)
   - `restaurantId` (ASC) + `username` (ASC) - UNIQUE
   - `phone` (ASC) + `restaurantId` (ASC)

2. **orders** collection:
   - `restaurantId` (ASC) + `status` (ASC) + `createdAt` (DESC)
   - `restaurantId` (ASC) + `userId` (ASC)
   - `restaurantId` (ASC) + `isGuestOrder` (ASC) + `status` (ASC)
   - `userId` (ASC) + `createdAt` (DESC)

3. **menu** collection:
   - `restaurantId` (ASC) + `category` (ASC)
   - `restaurantId` (ASC) + `isAvailable` (ASC)

4. **notifications** collection:
   - `restaurantId` (ASC) + `userId` (ASC) + `createdAt` (DESC)
   - `userId` (ASC) + `read` (ASC) + `createdAt` (DESC)

5. **restaurants** collection:
   - `shortCode` (ASC) - UNIQUE
   - `status` (ASC) + `plan` (ASC)

---

## Relationships

### One-to-Many

- **Restaurant → Users**: One restaurant has many users
- **Restaurant → Orders**: One restaurant has many orders
- **Restaurant → Menu Items**: One restaurant has many menu items
- **User → Orders**: One user (client) has many orders
- **User → Notifications**: One user has many notifications

### Denormalization

To optimize read performance, the following data is denormalized:

- **Order**: Contains `guestName`, `customerName` (copied from user) instead of just `userId`
- **Notification**: Contains `orderNumber` (copied from order) for display without additional query
- **Menu Item**: `restaurantId` duplicated in each document for efficient filtering

### Referential Integrity

Firestore does not enforce foreign key constraints. Application logic must maintain referential integrity:

- When deleting a restaurant, related users, orders, and menu items should be deleted (handled by Cloud Functions)
- When deleting a user, their orders remain but with `userId` set to a "deleted user" placeholder
- Menu items referenced in orders are denormalized (copied) to preserve order history

---

## Best Practices

### Query Optimization
- Always filter by `restaurantId` first (multi-tenant isolation)
- Use composite indexes for common query patterns
- Limit query results with pagination (`.limit(50)`)
- Use real-time listeners only when necessary (unsubscribe when done)

### Data Modeling
- Denormalize frequently accessed data
- Use subcollections for settings to avoid large documents
- Keep documents under 1 MB (Firestore limit)
- Use batch writes for multiple updates

### Security
- Firestore rules enforce `restaurantId` filtering
- Never trust client-side data for prices (validate in Cloud Functions)
- Use custom claims for authorization
- Audit sensitive operations in `audit_logs`
