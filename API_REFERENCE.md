# API Reference - Cloud Functions

## Table of Contents
- [Overview](#overview)
- [Authentication Functions](#authentication-functions)
- [User Management Functions](#user-management-functions)
- [Restaurant Management Functions](#restaurant-management-functions)
- [Client Signup Functions](#client-signup-functions)
- [Order Management Functions](#order-management-functions)
- [Push Notification Functions](#push-notification-functions)
- [Firestore Triggers](#firestore-triggers)
- [Helper Functions](#helper-functions)
- [Error Handling](#error-handling)

## Overview

All backend logic is implemented using Firebase Cloud Functions (v2). Functions are deployed to Firebase and called via HTTPS or triggered by Firestore events.

**File**: `functions/index.js` (2114 lines)

### Technology Stack
- **Runtime**: Node.js 18+
- **Module System**: ES Modules (import/export)
- **Framework**: Firebase Functions v2
- **Authentication**: Firebase Admin SDK
- **Database**: Cloud Firestore
- **Messaging**: Firebase Cloud Messaging (FCM)
- **Password Hashing**: bcrypt (10 salt rounds)

### Function Types
1. **Callable Functions** (`onCall`) - HTTPS functions called from frontend
2. **Firestore Triggers** (`onDocumentUpdated`) - Triggered by database changes

### Base URL
```
https://us-central1-<project-id>.cloudfunctions.net/{functionName}
```

### Calling Functions from Frontend

**Example** (JavaScript):
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const authenticateUser = httpsCallable(functions, 'authenticateUser');

const result = await authenticateUser({
  username: 'john_doe',
  password: 'SecurePass123'
});

console.log(result.data); // { success: true, token: '...', user: {...} }
```

---

## Authentication Functions

### 1. authenticateUser

**Purpose**: Authenticates restaurant users (managers, cashiers, cooks, clients)

**Authentication Required**: No (public endpoint)

**Parameters**:
```typescript
{
  username: string;  // User's username
  password: string;  // Plain text password
}
```

**Returns**:
```typescript
{
  success: true,
  token: string,     // Firebase custom auth token
  user: {
    id: string,
    username: string,
    name: string,
    role: "manager" | "cashier" | "cook" | "client",
    phone: string | null,
    isActive: boolean,
    restaurantId: string,
    isSuperAdmin: false,
    createdAt: number,
    updatedAt: number
  }
}
```

**Errors**:
- `invalid-argument` - Missing username or password
- `not-found` - Invalid credentials
- `permission-denied` - Account inactive or super admin attempting login
- `internal` - Server error

**Flow**:
1. Query `users` collection for username
2. Reject if user is super admin (must use `authenticateSuperAdmin`)
3. Verify password with bcrypt
4. Create custom claims with role, restaurantId
5. Generate custom auth token
6. Update `lastLogin` timestamp
7. Return token and user data

**Example**:
```javascript
const result = await authenticateUser({
  username: 'cashier_123',
  password: 'MyPassword1'
});

// Sign in with custom token
await signInWithCustomToken(auth, result.data.token);
```

**Custom Claims Structure**:
```javascript
{
  role: "cashier",
  username: "cashier_123",
  name: "John Doe",
  phone: "+1234567890",
  restaurantId: "rest_abc123",
  restaurantIds: ["rest_abc123"],
  isSuperAdmin: false
}
```

**Security**:
- Password never returned or logged
- Bcrypt comparison (10 salt rounds)
- Custom claims include restaurantId for multi-tenant isolation
- Super admins blocked from this endpoint

---

### 2. authenticateSuperAdmin

**Purpose**: Authenticates super admin users

**Authentication Required**: No (public endpoint)

**Parameters**:
```typescript
{
  username: string;
  password: string;
}
```

**Returns**:
```typescript
{
  success: true,
  token: string,     // Firebase custom auth token
  user: {
    id: string,
    username: string,
    name: string,
    role: "superAdmin",
    phone: string | null,
    isSuperAdmin: true,
    restaurantId: null,
    createdAt: number,
    updatedAt: number
  }
}
```

**Errors**:
- `invalid-argument` - Missing username or password
- `not-found` - Invalid credentials
- `permission-denied` - Account inactive
- `internal` - Server error

**Flow**:
1. Query `super_admins` collection (not `users`)
2. Check if status is "active"
3. Verify password with bcrypt
4. Create custom claims with `isSuperAdmin: true`
5. Generate custom auth token
6. Update `lastLoginAt`, reset `loginAttempts`
7. Log to `audit_logs` collection
8. Return token and user data

**Audit Logging**:
```javascript
// Successful login
{
  type: "super_admin_login",
  userId: "admin_123",
  username: "admin",
  timestamp: Timestamp,
  success: true,
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0..."
}

// Failed login
{
  type: "super_admin_login",
  username: "admin",
  timestamp: Timestamp,
  success: false,
  error: "Invalid credentials",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0..."
}
```

**Custom Claims**:
```javascript
{
  role: "superAdmin",
  username: "admin",
  name: "Platform Admin",
  phone: "+1234567890",
  restaurantId: null,
  isSuperAdmin: true
}
```

**Security**:
- Separate collection (`super_admins`)
- Failed login attempts tracked
- IP address and user agent logged
- All actions logged to audit trail

---

## User Management Functions

### 3. createUser

**Purpose**: Creates a new user within a restaurant

**Authentication Required**: Yes (Manager role only)

**Parameters**:
```typescript
{
  username: string;    // Must be unique
  password: string;    // Min 6 characters
  role: "manager" | "cashier" | "cook" | "client";
  name: string;
  phone?: string;
}
```

**Returns**:
```typescript
{
  success: true,
  userId: string,
  message: "User created successfully"
}
```

**Errors**:
- `permission-denied` - Not a manager
- `failed-precondition` - Manager has no restaurantId
- `invalid-argument` - Missing required fields or invalid role
- `already-exists` - Username taken
- `internal` - Server error

**Flow**:
1. Verify caller is manager
2. Get manager's restaurantId
3. Validate inputs (username, password, role, name)
4. Check username uniqueness
5. Hash password (bcrypt, 10 rounds)
6. Create Firebase Auth user
7. Set custom claims with restaurantId
8. Create Firestore user document
9. Return success with userId

**Automatic Assignment**:
- User assigned to manager's restaurant
- `createdBy` field set to manager's uid
- `status` set to "active"

**Example**:
```javascript
const result = await createUser({
  username: 'cook_john',
  password: 'SecurePass123',
  role: 'cook',
  name: 'John Smith',
  phone: '+1234567890'
});

console.log(result.data.userId); // "user_xyz789"
```

**Firestore Document Created**:
```javascript
// users/{userId}
{
  username: "cook_john",
  passwordHash: "$2b$10$...",
  role: "cook",
  name: "John Smith",
  phone: "+1234567890",
  restaurantId: "rest_abc123",
  isSuperAdmin: false,
  status: "active",
  createdAt: Timestamp,
  createdBy: "manager_uid"
}
```

---

### 4. updateUser

**Purpose**: Updates user information

**Authentication Required**: Yes (Manager role only)

**Parameters**:
```typescript
{
  userId: string;
  updates: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    role?: "manager" | "cashier" | "cook" | "client";
    status?: "active" | "inactive" | "suspended";
    password?: string;  // Min 6 characters
  }
}
```

**Returns**:
```typescript
{
  success: true,
  message: "User updated successfully"
}
```

**Errors**:
- `permission-denied` - Not a manager
- `invalid-argument` - Invalid role or status
- `not-found` - User doesn't exist
- `internal` - Server error

**Flow**:
1. Verify caller is manager
2. Get user document
3. Build update object with allowed fields
4. If role updated → update custom claims
5. If status updated → enable/disable in Firebase Auth
6. If password updated → hash and update
7. Update Firestore document
8. Return success

**Special Behaviors**:
- **Role change**: Updates custom claims immediately
- **Status change**: Disables/enables Firebase Auth account
- **Password change**: Rehashes with bcrypt
- **Audit trail**: Sets `updatedBy` and `updatedAt`

**Example**:
```javascript
await updateUser({
  userId: 'user_xyz789',
  updates: {
    role: 'manager',
    status: 'active',
    phone: '+9876543210'
  }
});
```

---

### 5. deleteUser

**Purpose**: Deletes a user permanently

**Authentication Required**: Yes (Manager role only)

**Parameters**:
```typescript
{
  userId: string;
}
```

**Returns**:
```typescript
{
  success: true,
  message: "User deleted successfully"
}
```

**Errors**:
- `permission-denied` - Not a manager
- `invalid-argument` - Trying to delete self
- `not-found` - User doesn't exist
- `internal` - Server error

**Flow**:
1. Verify caller is manager
2. Prevent self-deletion
3. Delete from Firebase Auth
4. Delete from Firestore
5. Return success

**Warning**: This is a permanent operation. User cannot be recovered.

**Example**:
```javascript
await deleteUser({ userId: 'user_xyz789' });
```

---

### 6. setUserRole

**Purpose**: Updates a user's role

**Authentication Required**: Yes (Manager role only)

**Parameters**:
```typescript
{
  userId: string;
  role: "manager" | "cashier" | "cook" | "client";
}
```

**Returns**:
```typescript
{
  success: true,
  message: "User role updated to {role}"
}
```

**Errors**:
- `permission-denied` - Not a manager
- `invalid-argument` - Invalid role
- `internal` - Server error

**Flow**:
1. Verify caller is manager
2. Validate role
3. Update Firestore document
4. Update custom claims
5. Return success

**Example**:
```javascript
await setUserRole({
  userId: 'user_xyz789',
  role: 'cashier'
});
```

---

### 7. updateUserStatus

**Purpose**: Activates or deactivates a user account

**Authentication Required**: Yes (Manager role only)

**Parameters**:
```typescript
{
  userId: string;
  status: "active" | "inactive";
}
```

**Returns**:
```typescript
{
  success: true,
  message: "User activated" | "User deactivated"
}
```

**Errors**:
- `permission-denied` - Not a manager
- `invalid-argument` - Invalid status
- `internal` - Server error

**Flow**:
1. Verify caller is manager
2. Validate status
3. Update Firestore document
4. Update Firebase Auth (enable/disable)
5. Return success

**Example**:
```javascript
await updateUserStatus({
  userId: 'user_xyz789',
  status: 'inactive'
});
```

---

## Restaurant Management Functions

### 8. createRestaurant

**Purpose**: Creates a new restaurant with optional admin user

**Authentication Required**: Yes (Super Admin only)

**Parameters**:
```typescript
{
  name: string;
  email: string;
  phone?: string;
  address?: string;
  plan: "basic" | "pro" | "enterprise";
  adminUser?: {
    username: string;
    password: string;
    name: string;
    email?: string;
    phone?: string;
  }
}
```

**Returns**:
```typescript
{
  success: true,
  restaurantId: string,
  restaurantCode: string,  // Auto-generated short code
  message: "Restaurant created successfully"
}
```

**Errors**:
- `permission-denied` - Not a super admin
- `invalid-argument` - Invalid plan or missing required fields
- `internal` - Server error

**Flow**:
1. Verify caller is super admin
2. Validate plan (basic/pro/enterprise)
3. Generate unique restaurant code (8 chars, uppercase)
4. Create restaurant document with:
   - Basic info (name, email, phone, address)
   - Plan and features
   - Billing info (30-day period)
   - Branding defaults
   - Usage stats (all zeros)
5. Create default settings subcollection
6. If adminUser provided:
   - Hash password
   - Create Firebase Auth user
   - Set custom claims with restaurantId
   - Create manager user document
7. Return restaurantId and restaurantCode

**Auto-Generated Fields**:
```javascript
{
  restaurantCode: "A1B2C3D4",  // Random 8-char code
  status: "active",
  billing: {
    currentPeriodStart: now,
    currentPeriodEnd: now + 30 days,
    cancelAtPeriodEnd: false,
    trialEndsAt: null
  },
  features: {
    // Based on plan
    analyticsEnabled: boolean,
    mobileAppEnabled: boolean,
    multiLocationEnabled: boolean,
    customBrandingEnabled: boolean,
    apiAccessEnabled: boolean,
    prioritySupportEnabled: boolean,
    maxStaffUsers: number,
    maxOrders: number
  },
  branding: {
    logoUrl: null,
    primaryColor: "#FF5722",
    secondaryColor: "#FFC107",
    accentColor: "#4CAF50",
    customDomain: null
  },
  usage: {
    totalOrders: 0,
    totalRevenue: 0,
    activeStaffUsers: 0,
    storageUsedMB: 0,
    lastActivityAt: now
  },
  onboardingCompleted: false,
  setupStep: "profile"
}
```

**Default Settings** (subcollection):
```javascript
// restaurants/{restaurantId}/settings/config
{
  ticket: {
    kitchenTicketEnabled: true,
    customerReceiptEnabled: true,
    autoPrintOnOrder: false,
    showTVA: true,
    tvaRate: 20,
    showCashierName: true,
    footerMessage: "Merci de votre visite!",
    kitchenTicketFormat: {
      showOrderNumber: true,
      showDateTime: true,
      showNotes: true,
      fontSize: "medium"
    },
    orderNumberFormat: "sequential"
  },
  printer: {
    vendorId: "0x0000",
    productId: "0x0000",
    paperWidth: 48,
    encoding: "GB18030",
    autoCut: true
  },
  kitchenDisplay: {
    fontSize: "large",
    showCustomerNotes: true,
    groupByCategory: false,
    highlightUrgent: true
  },
  notifications: {
    soundEnabled: true,
    soundVolume: 80
  }
}
```

**Features by Plan**:

| Feature | Basic | Pro | Enterprise |
|---------|-------|-----|-----------|
| Analytics | ❌ | ✅ | ✅ |
| Mobile App | ❌ | ✅ | ✅ |
| Multi-Location | ❌ | ❌ | ✅ |
| Custom Branding | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |
| Max Staff Users | 3 | Unlimited | Unlimited |
| Max Orders | Unlimited | Unlimited | Unlimited |

**Example**:
```javascript
const result = await createRestaurant({
  name: "Fast Burger",
  email: "contact@fastburger.com",
  phone: "+1234567890",
  address: "123 Main St, City",
  plan: "pro",
  adminUser: {
    username: "admin_burger",
    password: "SecurePass123!",
    name: "Admin User",
    email: "admin@fastburger.com"
  }
});

console.log(result.data);
// {
//   success: true,
//   restaurantId: "rest_abc123",
//   restaurantCode: "BURGER01",
//   message: "Restaurant created successfully"
// }
```

---

### 9. updateRestaurant

**Purpose**: Updates restaurant information

**Authentication Required**: Yes (Super Admin only)

**Parameters**:
```typescript
{
  restaurantId: string;
  updates: {
    name?: string;
    email?: string;
    phone?: string | null;
    address?: string;
    plan?: "basic" | "pro" | "enterprise";
    branding?: {
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      customDomain?: string;
    }
  }
}
```

**Returns**:
```typescript
{
  success: true,
  message: "Restaurant updated successfully"
}
```

**Errors**:
- `permission-denied` - Not a super admin
- `invalid-argument` - Invalid plan
- `not-found` - Restaurant doesn't exist
- `internal` - Server error

**Flow**:
1. Verify caller is super admin
2. Get restaurant document
3. Build update object
4. If plan updated → update features
5. If branding updated → merge with existing branding
6. Update Firestore document
7. Return success

**Example**:
```javascript
await updateRestaurant({
  restaurantId: 'rest_abc123',
  updates: {
    name: 'Fast Burger Deluxe',
    plan: 'enterprise',
    branding: {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#FF0000'
    }
  }
});
```

---

### 10. listRestaurants

**Purpose**: Lists all restaurants

**Authentication Required**: Yes (Super Admin only)

**Parameters**: None

**Returns**:
```typescript
{
  success: true,
  restaurants: Array<{
    id: string,
    name: string,
    email: string,
    phone: string | null,
    address: string | null,
    restaurantCode: string,
    plan: string,
    status: string,
    createdAt: Timestamp,
    // ... all other restaurant fields
  }>
}
```

**Errors**:
- `permission-denied` - Not a super admin
- `internal` - Server error

**Flow**:
1. Verify caller is super admin
2. Query all restaurants, ordered by `createdAt` desc
3. Return array of restaurant documents

**Example**:
```javascript
const result = await listRestaurants();
console.log(result.data.restaurants.length); // 10
```

---

### 11. suspendRestaurant

**Purpose**: Suspends, activates, or cancels a restaurant

**Authentication Required**: Yes (Super Admin only)

**Parameters**:
```typescript
{
  restaurantId: string;
  status: "active" | "suspended" | "cancelled";
}
```

**Returns**:
```typescript
{
  success: true,
  message: "Restaurant activated" | "Restaurant suspended" | "Restaurant cancelled"
}
```

**Errors**:
- `permission-denied` - Not a super admin
- `invalid-argument` - Invalid status
- `not-found` - Restaurant doesn't exist
- `internal` - Server error

**Flow**:
1. Verify caller is super admin
2. Validate status
3. Update restaurant status
4. If suspending/cancelling:
   - Find all users for this restaurant
   - Set all users to "inactive"
   - Disable all users in Firebase Auth
5. Return success

**Side Effects**:
- **Suspend/Cancel**: All restaurant users disabled
- **Activate**: Restaurant reopened (users must be manually reactivated)

**Example**:
```javascript
await suspendRestaurant({
  restaurantId: 'rest_abc123',
  status: 'suspended'
});
// All users for rest_abc123 are now disabled
```

---

### 12. toggleRestaurantOrders

**Purpose**: Toggles whether restaurant accepts mobile app orders

**Authentication Required**: Yes (Super Admin OR Restaurant Staff)

**Parameters**:
```typescript
{
  restaurantId: string;
  acceptingOrders: boolean;
}
```

**Returns**:
```typescript
{
  success: true,
  message: "Restaurant is now accepting orders" | "Restaurant has stopped accepting orders",
  acceptingOrders: boolean
}
```

**Errors**:
- `unauthenticated` - Not logged in
- `permission-denied` - Not super admin or not staff of this restaurant
- `invalid-argument` - Missing or invalid parameters
- `not-found` - Restaurant doesn't exist
- `internal` - Server error

**Flow**:
1. Verify caller is authenticated
2. Check if super admin OR staff of target restaurant
3. Update restaurant `acceptingOrders` field
4. Return success

**Use Cases**:
- Restaurant closes for the day
- Kitchen is overwhelmed
- Special event (private party)
- System maintenance

**Example**:
```javascript
// Close orders
await toggleRestaurantOrders({
  restaurantId: 'rest_abc123',
  acceptingOrders: false
});

// Reopen orders
await toggleRestaurantOrders({
  restaurantId: 'rest_abc123',
  acceptingOrders: true
});
```

---

## Client Signup Functions

### 13. validateRestaurantCode

**Purpose**: Validates a restaurant code and returns details

**Authentication Required**: No (public endpoint)

**Parameters**:
```typescript
{
  code: string;  // Restaurant short code (e.g., "BURGER01")
}
```

**Returns**:
```typescript
{
  success: true,
  restaurant: {
    id: string,
    name: string,
    shortCode: string,
    email: string | null,
    phone: string | null,
    status: "active" | "trial",
    plan: string,
    branding: object | null
  }
}
```

**Errors**:
- `invalid-argument` - Missing code
- `not-found` - Restaurant not found or inactive
- `internal` - Server error

**Flow**:
1. Normalize code to uppercase
2. Query `restaurants` by `shortCode`
3. Filter by status in ["active", "trial"]
4. Return restaurant details (sanitized)

**Example**:
```javascript
const result = await validateRestaurantCode({ code: 'burger01' });
console.log(result.data.restaurant.name); // "Fast Burger"
```

---

### 14. signUpClient

**Purpose**: Registers a new client user with auto-generated username

**Authentication Required**: No (public endpoint)

**Parameters**:
```typescript
{
  restaurantId: string;
  name: string;
  phone: string;      // E.164 format recommended
  password: string;   // Min 6 characters
}
```

**Returns**:
```typescript
{
  success: true,
  token: string,      // Custom auth token
  user: {
    id: string,
    username: string,    // Auto-generated: "client_{phone_last4}_{random3}"
    name: string,
    phone: string,
    role: "client",
    restaurantId: string,
    restaurantIds: string[],
    activeRestaurantId: string,
    isActive: true,
    createdAt: number,
    updatedAt: number
  }
}
```

**Errors**:
- `invalid-argument` - Missing fields, weak password, or invalid phone
- `not-found` - Restaurant doesn't exist
- `failed-precondition` - Restaurant not active
- `already-exists` - Phone already registered
- `internal` - Failed to generate unique username

**Flow**:
1. Validate inputs (restaurantId, name, phone, password)
2. Verify restaurant exists and is active
3. Check phone uniqueness for this restaurant
4. Generate username: `client_{phone_last4}_{random3}`
5. Ensure username uniqueness (retry up to 5 times)
6. Hash password
7. Create Firebase Auth user
8. Set custom claims with restaurantId
9. Create Firestore user document
10. Generate custom auth token
11. Return token and user data

**Username Generation**:
```javascript
// Phone: +1234567890
// Last 4 digits: 7890
// Random 3 chars: a1b
// Username: client_7890_a1b
```

**Multi-Restaurant Support**:
- `restaurantId` - Legacy single restaurant
- `restaurantIds` - Array of restaurants (supports future expansion)
- `activeRestaurantId` - Currently selected restaurant

**Example**:
```javascript
const result = await signUpClient({
  restaurantId: 'rest_abc123',
  name: 'Jane Doe',
  phone: '+1234567890',
  password: 'SecurePass123'
});

console.log(result.data.user.username); // "client_7890_a1b"

// Sign in with custom token
await signInWithCustomToken(auth, result.data.token);
```

**Firestore Document Created**:
```javascript
// users/{userId}
{
  username: "client_7890_a1b",
  passwordHash: "$2b$10$...",
  role: "client",
  name: "Jane Doe",
  phone: "+1234567890",
  restaurantId: "rest_abc123",
  restaurantIds: ["rest_abc123"],
  activeRestaurantId: "rest_abc123",
  isSuperAdmin: false,
  status: "active",
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### 15. addRestaurantToUser

**Purpose**: Adds a new restaurant to user's account (multi-restaurant support)

**Authentication Required**: Yes

**Parameters**:
```typescript
{
  restaurantCode: string;  // Short code (e.g., "PIZZA01")
}
```

**Returns**:
```typescript
{
  success: true,
  message: "Restaurant added successfully" | "Restaurant already in your list",
  restaurant: {
    id: string,
    name: string,
    shortCode: string
  },
  totalRestaurants: number
}
```

**Errors**:
- `unauthenticated` - Not logged in
- `invalid-argument` - Missing code
- `not-found` - Restaurant not found or user not found
- `internal` - Server error

**Flow**:
1. Verify user is authenticated
2. Normalize code to uppercase
3. Query restaurant by shortCode
4. Get user document
5. Check if restaurant already in `restaurantIds`
6. If not, append to `restaurantIds` array
7. Update user document
8. Return success with restaurant details

**Example**:
```javascript
const result = await addRestaurantToUser({
  restaurantCode: 'PIZZA01'
});

console.log(result.data.totalRestaurants); // 2
```

---

### 16. setActiveRestaurant

**Purpose**: Switches user's active restaurant and updates token claims

**Authentication Required**: Yes

**Parameters**:
```typescript
{
  restaurantId: string;
}
```

**Returns**:
```typescript
{
  success: true,
  message: "Active restaurant updated",
  token: string,  // New custom token with updated claims
  restaurant: {
    id: string,
    name: string,
    shortCode: string
  }
}
```

**Errors**:
- `unauthenticated` - Not logged in
- `invalid-argument` - Missing restaurantId
- `not-found` - User or restaurant not found
- `permission-denied` - User doesn't have access to this restaurant
- `internal` - Server error

**Flow**:
1. Verify user is authenticated
2. Get user document
3. Verify restaurant is in user's `restaurantIds`
4. Get restaurant details
5. Update user's `activeRestaurantId` and `restaurantId`
6. Update custom claims with new `restaurantId`
7. Generate new custom token
8. Return token and restaurant details

**Important**: User must sign in with new token to apply changes.

**Example**:
```javascript
const result = await setActiveRestaurant({
  restaurantId: 'rest_xyz789'
});

// Sign in with new token
await signInWithCustomToken(auth, result.data.token);
```

---

## Order Management Functions

### 17. updateOrder

**Purpose**: Securely updates an order with price validation

**Authentication Required**: Yes (Cashier or Manager only)

**Parameters**:
```typescript
{
  orderId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    notes?: string;
  }>;
  customerName?: string;
  notes?: string;
}
```

**Returns**:
```typescript
{
  success: true,
  message: "Order updated successfully",
  orderId: string,
  totalAmount: number,
  itemCount: number
}
```

**Errors**:
- `unauthenticated` - Not logged in
- `permission-denied` - Not cashier/manager, order from different restaurant, client order, completed/cancelled/paid order
- `invalid-argument` - Missing orderId, empty items, invalid menu item, invalid quantity
- `not-found` - Order not found
- `internal` - Server error

**Flow**:
1. Verify user is cashier or manager
2. Get order document
3. **Security Check 1**: Verify order belongs to user's restaurant
4. **Security Check 2**: Verify order is NOT a client order (userId must be null)
5. **Security Check 3**: Verify order is editable (not completed/cancelled/rejected/paid)
6. Fetch menu items to get current prices
7. **Security**: Always use menu prices, never accept prices from client
8. Build updated items with locked prices
9. Recalculate total amount
10. Create edit history entry
11. Update order document
12. Return success with new total

**Security Features**:
- ✅ Prices always locked to menu (cannot be manipulated)
- ✅ Only staff-created orders can be edited
- ✅ Client orders are immutable
- ✅ Completed/paid orders cannot be edited
- ✅ Full audit trail in `editHistory` array

**Edit History Entry**:
```javascript
{
  editedBy: "user_manager123",
  editedByName: "John Manager",
  editedAt: Timestamp,
  previousItems: [...],
  previousTotal: 25.99,
  previousCustomerName: "Jane Doe",
  previousNotes: "No pickles"
}
```

**Example**:
```javascript
const result = await updateOrder({
  orderId: 'order_abc123',
  items: [
    { menuItemId: 'menu_burger001', quantity: 3 },
    { menuItemId: 'menu_fries001', quantity: 2, notes: 'Extra salt' }
  ],
  customerName: 'John Smith',
  notes: 'For delivery'
});

console.log(result.data.totalAmount); // 31.97
```

**What Gets Updated**:
```javascript
{
  items: [...],           // New items with locked prices
  totalAmount: 31.97,     // Recalculated
  itemCount: 5,           // 3 + 2
  customerName: "...",    // Updated
  notes: "...",           // Updated
  editedBy: "...",
  editedByName: "...",
  editedAt: Timestamp,
  editHistory: [...]      // Append edit entry
}
```

---

## Push Notification Functions

### 18. registerFCMToken

**Purpose**: Registers user's FCM token for push notifications

**Authentication Required**: Yes

**Parameters**:
```typescript
{
  fcmToken: string;  // Firebase Cloud Messaging token from device
}
```

**Returns**:
```typescript
{
  success: true,
  message: "FCM token registered successfully"
}
```

**Errors**:
- `unauthenticated` - Not logged in
- `invalid-argument` - Missing or invalid token
- `internal` - Server error

**Flow**:
1. Verify user is authenticated
2. Validate FCM token
3. Update user document with token
4. Set `fcmTokenUpdatedAt` timestamp
5. Return success

**Example** (Android):
```javascript
// Get FCM token
const fcmToken = await messaging().getToken();

// Register with backend
await registerFCMToken({ fcmToken });
```

**User Document Update**:
```javascript
{
  fcmToken: "d1a2b3c4e5f6...",
  fcmTokenUpdatedAt: Timestamp
}
```

---

### 19. removeFCMToken

**Purpose**: Removes user's FCM token (e.g., on logout)

**Authentication Required**: Yes

**Parameters**: None

**Returns**:
```typescript
{
  success: true,
  message: "FCM token removed successfully"
}
```

**Errors**:
- `unauthenticated` - Not logged in
- `internal` - Server error

**Flow**:
1. Verify user is authenticated
2. Update user document, set `fcmToken` to null
3. Return success

**Example**:
```javascript
// On logout
await removeFCMToken();
await signOut(auth);
```

---

## Firestore Triggers

### 20. onOrderStatusChanged

**Purpose**: Automatically sends push notifications when order status changes

**Trigger**: Firestore document update on `orders/{orderId}`

**Conditions**:
- Only triggers if `status` field changed
- Only sends notification for: `preparing`, `ready`, `completed`, `rejected`

**Flow**:
1. Detect status change (before vs after)
2. If status unchanged → exit
3. If new status is notifiable → continue
4. **Special Case**: If `awaiting_approval` → `pending`:
   - Create notification for kitchen staff (role: cook)
5. If order has `userId`:
   - Get user's FCM token
   - Send push notification via FCM
   - Create notification document in Firestore
6. Handle invalid/expired FCM tokens (remove from user)

**Push Notification Structure**:
```javascript
{
  token: "d1a2b3c4e5f6...",
  data: {
    type: "order_status_update",
    orderId: "order_abc123",
    orderNumber: "0847",
    status: "ready",
    rejectionReason: ""
  },
  notification: {
    title: "Commande prête!",
    body: "Votre commande 0847 est prête! Venez la récupérer."
  },
  android: {
    priority: "high"
  }
}
```

**Notification Titles & Messages**:

| Status | Title | Body |
|--------|-------|------|
| preparing | "Préparation en cours" | "Votre commande {number} est en cours de préparation." |
| ready | "Commande prête!" | "Votre commande {number} est prête! Venez la récupérer." |
| completed | "Merci!" | "Votre commande {number} est terminée. Merci de votre visite!" |
| rejected | "Commande refusée" | "Désolé, votre commande {number} a été refusée. {reason}" |

**Firestore Notification Document**:
```javascript
// notifications/{notificationId}
{
  type: "order_status_update",
  orderId: "order_abc123",
  orderNumber: "0847",
  title: "Commande prête!",
  message: "Votre commande 0847 est prête!...",
  userId: "user_client123",
  status: "ready",
  read: false,
  createdAt: Timestamp
}
```

**Kitchen Notification** (order approved):
```javascript
{
  type: "order_approved",
  orderId: "order_abc123",
  orderNumber: "0847",
  title: "New Order Approved",
  message: "Order 0847 is ready for preparation",
  targetRole: "cook",
  read: false,
  createdAt: Timestamp
}
```

**Error Handling**:
- Invalid FCM token → Remove from user document
- Expired token → Remove from user document
- No FCM token → Log warning, skip notification
- Guest orders (no userId) → Skip client notification

---

## Helper Functions

### getRestaurantIdFromAuth

**Purpose**: Extracts restaurantId from authenticated user

**Parameters**: `request` object from Cloud Function

**Returns**: `string | null`

**Logic**:
1. Check custom claims for `restaurantId`
2. If not in claims, query Firestore user document
3. Return `restaurantId` or `null`

**Usage**:
```javascript
const restaurantId = await getRestaurantIdFromAuth(request);
if (!restaurantId) {
  throw new HttpsError("permission-denied", "User must belong to a restaurant");
}
```

---

### validateRestaurantAccess

**Purpose**: Validates user has access to specific restaurant

**Parameters**:
- `request` - Cloud Function request
- `restaurantId` - Restaurant to check access

**Returns**: `boolean`

**Logic**:
1. Get user's restaurantId from auth
2. Compare with target restaurantId
3. Return true if match

**Usage**:
```javascript
const hasAccess = await validateRestaurantAccess(request, 'rest_abc123');
if (!hasAccess) {
  throw new HttpsError("permission-denied", "Access denied");
}
```

---

### getFeaturesByPlan

**Purpose**: Returns feature object based on subscription plan

**Parameters**: `plan` ("basic" | "pro" | "enterprise")

**Returns**: Features object

**Features**:
```javascript
{
  basic: {
    analyticsEnabled: false,
    mobileAppEnabled: false,
    multiLocationEnabled: false,
    customBrandingEnabled: false,
    apiAccessEnabled: false,
    prioritySupportEnabled: false,
    maxStaffUsers: 3,
    maxOrders: -1  // Unlimited
  },
  pro: {
    analyticsEnabled: true,
    mobileAppEnabled: true,
    multiLocationEnabled: false,
    customBrandingEnabled: false,
    apiAccessEnabled: false,
    prioritySupportEnabled: true,
    maxStaffUsers: -1,  // Unlimited
    maxOrders: -1
  },
  enterprise: {
    analyticsEnabled: true,
    mobileAppEnabled: true,
    multiLocationEnabled: true,
    customBrandingEnabled: true,
    apiAccessEnabled: true,
    prioritySupportEnabled: true,
    maxStaffUsers: -1,
    maxOrders: -1
  }
}
```

---

### getUserFCMToken

**Purpose**: Retrieves user's FCM token from Firestore

**Parameters**: `userId` (string)

**Returns**: `string | null`

**Logic**:
1. Get user document
2. Return `fcmToken` field or null

---

### sendOrderStatusNotification

**Purpose**: Sends push notification to user about order status

**Parameters**:
- `userId` - User to notify
- `orderId` - Order ID
- `orderNumber` - Display order number
- `newStatus` - New status
- `rejectionReason` - Optional rejection reason

**Returns**: FCM response or null

**Logic**:
1. Get user's FCM token
2. Build notification message
3. Send via Firebase Cloud Messaging
4. Handle errors (invalid/expired tokens)

---

### getNotificationTitle / getNotificationBody

**Purpose**: Generates notification text based on status

**Parameters**:
- `status` - Order status
- `orderNumber` - Order number (for body)
- `rejectionReason` - Optional (for rejected orders)

**Returns**: String

---

## Error Handling

### Error Types

Firebase Functions use `HttpsError` with standard error codes:

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `invalid-argument` | 400 | Missing or invalid parameters |
| `unauthenticated` | 401 | Not logged in |
| `permission-denied` | 403 | Insufficient permissions |
| `not-found` | 404 | Resource doesn't exist |
| `already-exists` | 409 | Resource already exists |
| `failed-precondition` | 412 | Precondition not met |
| `internal` | 500 | Server error |

### Error Response Format

```javascript
{
  code: "permission-denied",
  message: "Only managers can create users",
  details: undefined
}
```

### Handling Errors in Frontend

```javascript
try {
  const result = await createUser({ username: 'test', ... });
} catch (error) {
  if (error.code === 'permission-denied') {
    console.error('You do not have permission to create users');
  } else if (error.code === 'already-exists') {
    console.error('Username already taken');
  } else {
    console.error('An error occurred:', error.message);
  }
}
```

### Common Error Patterns

**Authentication Errors**:
```javascript
if (!request.auth) {
  throw new HttpsError("unauthenticated", "User must be authenticated");
}
```

**Authorization Errors**:
```javascript
if (request.auth.token.role !== "manager") {
  throw new HttpsError("permission-denied", "Only managers can...");
}
```

**Validation Errors**:
```javascript
if (!username || !password) {
  throw new HttpsError("invalid-argument", "Username and password are required");
}
```

**Not Found Errors**:
```javascript
if (!userDoc.exists) {
  throw new HttpsError("not-found", "User not found");
}
```

---

## Best Practices

### 1. Always Validate Inputs
```javascript
if (!orderId || !items || items.length === 0) {
  throw new HttpsError("invalid-argument", "Valid order data required");
}
```

### 2. Use Try-Catch Blocks
```javascript
try {
  // Function logic
} catch (error) {
  console.error("Function error:", error);
  if (error instanceof HttpsError) {
    throw error;
  }
  throw new HttpsError("internal", "Operation failed");
}
```

### 3. Log Important Actions
```javascript
console.log(`User ${userId} updated order ${orderId}`);
console.error(`Failed to send notification:`, error);
```

### 4. Validate Restaurant Access
```javascript
const userRestaurantId = await getRestaurantIdFromAuth(request);
if (order.restaurantId !== userRestaurantId) {
  throw new HttpsError("permission-denied", "Access denied");
}
```

### 5. Never Trust Client Data
```javascript
// BAD: Accepting price from client
const price = item.price;

// GOOD: Always fetch from database
const menuDoc = await db.collection('menu').doc(item.menuItemId).get();
const price = menuDoc.data().price;
```

### 6. Create Audit Trails
```javascript
const updateData = {
  ...changes,
  updatedBy: request.auth.uid,
  updatedAt: new Date()
};
```

### 7. Handle Async Operations Properly
```javascript
// BAD: Unhandled promise
auth.deleteUser(userId);

// GOOD: Await promise
await auth.deleteUser(userId);
```

---

## Function Summary Table

| Function | Auth Required | Role | Purpose |
|----------|---------------|------|---------|
| authenticateUser | No | - | Login restaurant users |
| authenticateSuperAdmin | No | - | Login super admins |
| createUser | Yes | Manager | Create new user |
| updateUser | Yes | Manager | Update user info |
| deleteUser | Yes | Manager | Delete user |
| setUserRole | Yes | Manager | Change user role |
| updateUserStatus | Yes | Manager | Activate/deactivate user |
| createRestaurant | Yes | Super Admin | Create restaurant |
| updateRestaurant | Yes | Super Admin | Update restaurant |
| listRestaurants | Yes | Super Admin | List all restaurants |
| suspendRestaurant | Yes | Super Admin | Suspend/activate restaurant |
| toggleRestaurantOrders | Yes | Super Admin / Staff | Toggle order acceptance |
| validateRestaurantCode | No | - | Validate restaurant code |
| signUpClient | No | - | Register new client |
| addRestaurantToUser | Yes | - | Add restaurant to account |
| setActiveRestaurant | Yes | - | Switch active restaurant |
| updateOrder | Yes | Cashier / Manager | Edit order securely |
| registerFCMToken | Yes | - | Register push token |
| removeFCMToken | Yes | - | Remove push token |
| onOrderStatusChanged | Trigger | - | Send order notifications |

---

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md) - Firestore collections and structure
- [Authentication Guide](./AUTHENTICATION_GUIDE.md) - Custom token authentication
- [Technical Overview](./TECHNICAL_OVERVIEW.md) - System architecture
- [Frontend Guide](./FRONTEND_GUIDE.md) - Calling functions from React
