# Authentication & Authorization Guide

## Table of Contents
- [Overview](#overview)
- [Authentication Methods](#authentication-methods)
- [Custom Token Authentication](#custom-token-authentication)
- [User Roles](#user-roles)
- [Authorization with RBAC](#authorization-with-rbac)
- [Firestore Security Rules](#firestore-security-rules)
- [Protected Routes](#protected-routes)
- [Login Flows](#login-flows)

## Overview

The system uses **Firebase Authentication with Custom Tokens** and **Role-Based Access Control (RBAC)** to secure the application.

### Key Concepts

- **Authentication**: Verifying who the user is (login)
- **Authorization**: Determining what the user can do (permissions)
- **Custom Claims**: JWT token fields storing user role and restaurant association
- **Multi-Tenancy**: Users are scoped to specific restaurants via `restaurantId`
- **Session Management**:
  - Authenticated users: Firebase Auth session
  - Guests: localStorage-based sessions (60 minutes)

## Authentication Methods

### 1. Restaurant Users (Staff)
- **Method**: Username/Password → Custom Token
- **Flow**: Cloud Function validates credentials → generates custom token
- **Roles**: Manager, Cashier, Cook

### 2. Clients (Mobile App Users)
- **Method**: Phone Number → Custom Token
- **Flow**: Sign up with phone → auto-generated username → custom token
- **Roles**: Client

### 3. Super Admins
- **Method**: Username/Password → Custom Token
- **Flow**: Separate Cloud Function → custom claims with `isSuperAdmin=true`
- **Roles**: Super Admin

### 4. Guests (QR Code Users)
- **Method**: No authentication
- **Flow**: Session-based (localStorage)
- **Access**: Limited to ordering and tracking

## Custom Token Authentication

### Why Custom Tokens?

Firebase Authentication typically uses email/password or phone auth, but we need:
- Username-based login (not email)
- Custom user roles stored in Firestore
- Multi-tenant isolation
- Backward compatibility with existing user database

### Custom Token Flow

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└─────┬───────┘
      │ 1. POST { username, password }
      ▼
┌─────────────────────────────┐
│   Cloud Function            │
│   authenticateUser()        │
├─────────────────────────────┤
│ 2. Query Firestore users    │
│ 3. Verify bcrypt password   │
│ 4. Create custom claims     │
│ 5. Generate custom token    │
└─────┬───────────────────────┘
      │ 6. Return { token, user }
      ▼
┌─────────────┐
│   Client    │
├─────────────┤
│ 7. signInWithCustomToken(token) │
│ 8. Store user in AuthContext     │
│ 9. Navigate to dashboard          │
└─────────────┘
```

### Custom Claims Structure

```javascript
{
  role: "manager",              // User role
  username: "john_manager",     // Username
  name: "John Doe",             // Display name
  phone: "+1234567890",         // Phone number
  restaurantId: "rest_abc123",  // Primary restaurant
  restaurantIds: ["rest_abc123"], // Multi-restaurant support
  isSuperAdmin: false           // Super admin flag
}
```

### Accessing Claims in Frontend

```javascript
// In React component
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();

  console.log(user.role);          // "manager"
  console.log(user.restaurantId);  // "rest_abc123"
  console.log(user.isSuperAdmin);  // false
}
```

### Accessing Claims in Security Rules

```javascript
// firestore.rules
match /orders/{orderId} {
  allow read: if request.auth.token.restaurantId == resource.data.restaurantId;
}
```

## User Roles

### Role Hierarchy

```
Super Admin (Platform Owner)
    │
    ├─── Manager (Restaurant Admin)
    │       │
    │       ├─── Cashier (Order Management)
    │       │
    │       └─── Cook (Kitchen Display)
    │
    └─── Client (Mobile App User)

Guest (Unauthenticated, QR Code Access)
```

### Role Permissions

| Permission | Super Admin | Manager | Cashier | Cook | Client | Guest |
|-----------|------------|---------|---------|------|--------|-------|
| **Restaurants** |
| Create Restaurant | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View All Restaurants | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Edit Restaurant | ✓ | ✓ (own) | ✗ | ✗ | ✗ | ✗ |
| Suspend Restaurant | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Users** |
| Create Users | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| View Users | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Edit Users | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Delete Users | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Orders** |
| View All Orders | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Create Orders | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ (approval required) |
| Edit Orders | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Cancel Orders | ✗ | ✓ | ✓ | ✗ | ✓ (own) | ✗ |
| Update Status | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Process Payment | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Approve/Reject | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Menu** |
| View Menu | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add Menu Item | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Edit Menu Item | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete Menu Item | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Toggle Availability | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Analytics** |
| View Dashboard | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| View Reports | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Kitchen** |
| View Kitchen Display | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Update Order Status | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Other** |
| Generate QR Codes | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage Settings | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |

### Role Definitions

#### Super Admin
- **Purpose**: Platform administrator
- **Access**: All restaurants and system settings
- **Login**: `/admin-login`
- **Dashboard**: `/admin/restaurants`
- **Use Cases**: Create restaurants, suspend accounts, view all data

#### Manager
- **Purpose**: Restaurant owner/administrator
- **Access**: Full control of their restaurant
- **Login**: `/login`
- **Dashboard**: `/orders`
- **Use Cases**: Manage staff, view analytics, configure settings

#### Cashier
- **Purpose**: Front-of-house staff
- **Access**: Orders, menu, kitchen display
- **Login**: `/login`
- **Dashboard**: `/orders`
- **Use Cases**: Take orders, process payments, manage menu

#### Cook
- **Purpose**: Kitchen staff
- **Access**: Kitchen display only
- **Login**: `/login`
- **Dashboard**: `/kitchen`
- **Use Cases**: View and update order status

#### Client
- **Purpose**: Mobile app customer
- **Access**: Browse menu, place orders, track orders
- **Login**: Mobile app (phone auth)
- **Dashboard**: Customer menu
- **Use Cases**: Order food, track delivery, view history

#### Guest
- **Purpose**: Walk-in customer via QR code
- **Access**: Browse menu, place order (requires approval), track order
- **Login**: None (session-based)
- **Dashboard**: `/guest/{restaurantCode}`
- **Use Cases**: Quick ordering without app installation

## Authorization with RBAC

### Implementation: AuthContext

**File**: `frontend/src/contexts/AuthContext.jsx`

```javascript
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user has specific role
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  }, [user]);

  // Check if user is super admin
  const isSuperAdmin = useCallback(() => {
    return user?.isSuperAdmin === true;
  }, [user]);

  // ... login/logout logic

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      hasRole,
      isSuperAdmin,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Checking Permissions in Components

```javascript
import { useAuth } from '../contexts/AuthContext';

function OrdersPage() {
  const { user, hasRole } = useAuth();

  const canEditOrders = hasRole(['manager', 'cashier']);
  const canViewAnalytics = hasRole('manager');

  return (
    <div>
      {canEditOrders && (
        <button onClick={handleEdit}>Edit Order</button>
      )}

      {canViewAnalytics && (
        <AnalyticsDashboard />
      )}
    </div>
  );
}
```

## Firestore Security Rules

**File**: `firestore.rules`

### Helper Functions

```javascript
// Check if user is authenticated
function isAuthenticated() {
  return request.auth != null;
}

// Check if user has specific role
function hasRole(role) {
  return isAuthenticated() && request.auth.token.role == role;
}

// Check if user is manager or cashier
function isStaff() {
  return hasRole('manager') || hasRole('cashier') || hasRole('cook');
}

// Check if user is client
function isClient() {
  return hasRole('client');
}

// Check if user is super admin
function isSuperAdmin() {
  return isAuthenticated() && request.auth.token.isSuperAdmin == true;
}

// Check if user belongs to the same restaurant
function belongsToSameRestaurant(restaurantId) {
  return isAuthenticated() &&
         request.auth.token.restaurantIds.hasAny([restaurantId]);
}
```

### Collection Rules Examples

#### Restaurants Collection

```javascript
match /restaurants/{restaurantId} {
  // Anyone can read (for guest order validation)
  allow read: if true;

  // Only super admin can create
  allow create: if isSuperAdmin();

  // Super admin or restaurant manager can update
  allow update: if isSuperAdmin() ||
                   (hasRole('manager') && belongsToSameRestaurant(restaurantId));

  // Only super admin can delete
  allow delete: if isSuperAdmin();
}
```

#### Users Collection

```javascript
match /users/{userId} {
  // Users can read their own document
  // Managers can read users in their restaurant
  // Super admin can read all
  allow read: if isSuperAdmin() ||
                 request.auth.uid == userId ||
                 (hasRole('manager') && belongsToSameRestaurant(resource.data.restaurantId));

  // Only managers can create users in their restaurant
  allow create: if hasRole('manager') &&
                   belongsToSameRestaurant(request.resource.data.restaurantId);

  // Users can update their own profile
  // Managers can update users in their restaurant
  allow update: if request.auth.uid == userId ||
                   (hasRole('manager') && belongsToSameRestaurant(resource.data.restaurantId));
}
```

#### Orders Collection

```javascript
match /orders/{orderId} {
  // Staff can read all restaurant orders
  // Clients can read their own orders
  // Guests can read guest orders (validated by tracking secret in app)
  allow read: if isSuperAdmin() ||
                 (isStaff() && belongsToSameRestaurant(resource.data.restaurantId)) ||
                 (isClient() && resource.data.userId == request.auth.uid) ||
                 resource.data.isGuestOrder == true;

  // Staff can create orders in their restaurant
  // Clients can create orders with their userId
  // Guests can create without auth (if restaurant accepts orders)
  allow create: if (isStaff() && belongsToSameRestaurant(request.resource.data.restaurantId)) ||
                   (isClient() && request.resource.data.userId == request.auth.uid) ||
                   (!isAuthenticated() &&
                    request.resource.data.isGuestOrder == true &&
                    request.resource.data.status == 'awaiting_approval' &&
                    get(/databases/$(database)/documents/restaurants/$(request.resource.data.restaurantId)).data.acceptingOrders == true);

  // Only staff can update orders
  allow update: if isStaff() && belongsToSameRestaurant(resource.data.restaurantId);
}
```

#### Menu Collection

```javascript
match /menu/{menuItemId} {
  // Anyone can read menu (for guests)
  allow read: if true;

  // Only staff can write
  allow write: if isStaff() && belongsToSameRestaurant(request.resource.data.restaurantId);
}
```

## Protected Routes

**File**: `frontend/src/components/ProtectedRoute.jsx`

```javascript
export default function ProtectedRoute({
  children,
  allowedRoles = [],
  requireSuperAdmin = false
}) {
  const { user, loading, hasRole, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // Not authenticated - redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check super admin requirement
  if (requireSuperAdmin && !isSuperAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check role requirement
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
```

### Usage in Routes

```javascript
// App.jsx
<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/admin-login" element={<PlatformAdminLogin />} />
  <Route path="/guest/:restaurantCode" element={<GuestOrder />} />

  {/* Staff Routes */}
  <Route path="/orders" element={
    <ProtectedRoute allowedRoles={['manager', 'cashier']}>
      <Orders />
    </ProtectedRoute>
  } />

  <Route path="/kitchen" element={
    <ProtectedRoute allowedRoles={['manager', 'cashier', 'cook']}>
      <Kitchen />
    </ProtectedRoute>
  } />

  <Route path="/users" element={
    <ProtectedRoute allowedRoles={['manager']}>
      <Users />
    </ProtectedRoute>
  } />

  {/* Super Admin Routes */}
  <Route path="/admin/restaurants" element={
    <ProtectedRoute requireSuperAdmin={true}>
      <Restaurants />
    </ProtectedRoute>
  } />

  {/* Client Routes */}
  <Route path="/customer-menu" element={
    <ProtectedRoute allowedRoles={['client']}>
      <CustomerMenu />
    </ProtectedRoute>
  } />
</Routes>
```

## Login Flows

### Restaurant User Login

**Endpoint**: `authenticateUser` Cloud Function

**Frontend Code**:
```javascript
// Login.jsx
const handleLogin = async (e) => {
  e.preventDefault();

  try {
    // 1. Call Cloud Function
    const authenticateUser = httpsCallable(functions, 'authenticateUser');
    const result = await authenticateUser({
      username: username.trim(),
      password: password
    });

    // 2. Get custom token
    const { token, user: userData } = result.data;

    // 3. Sign in with custom token
    await signInWithCustomToken(auth, token);

    // 4. Store user in context
    login(userData);

    // 5. Navigate based on role
    if (userData.role === 'cook') {
      navigate('/kitchen');
    } else {
      navigate('/orders');
    }
  } catch (error) {
    setError('Invalid username or password');
  }
};
```

**Backend Code** (Cloud Function):
```javascript
// functions/index.js
export const authenticateUser = onCall(async (request) => {
  const { username, password } = request.data;

  // 1. Query user from Firestore
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  const userDoc = snapshot.docs[0];
  const user = userDoc.data();

  // 2. Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new functions.https.HttpsError('unauthenticated', 'Invalid password');
  }

  // 3. Create custom claims
  const customClaims = {
    role: user.role,
    username: user.username,
    name: user.name,
    phone: user.phone || null,
    restaurantId: user.restaurantId,
    restaurantIds: user.restaurantIds || [user.restaurantId],
    isSuperAdmin: false
  };

  // 4. Generate custom token
  const token = await admin.auth().createCustomToken(userDoc.id, customClaims);

  // 5. Update last login
  await updateDoc(userDoc.ref, {
    lastLogin: serverTimestamp()
  });

  // 6. Return token and user data
  return {
    token,
    user: {
      uid: userDoc.id,
      ...customClaims
    }
  };
});
```

### Super Admin Login

**Endpoint**: `authenticateSuperAdmin` Cloud Function

**Flow**: Similar to restaurant user login, but:
- Queries `super_admins` collection
- Sets `isSuperAdmin: true` in custom claims
- Logs action to `audit_logs`
- Navigates to `/admin/restaurants`

### Client Signup

**Endpoint**: `signUpClient` Cloud Function

**Flow**:
1. Validate restaurant code
2. Auto-generate username: `client_{last4digits}_{random}`
3. Hash password
4. Create Firebase Auth user
5. Set custom claims
6. Create Firestore user document
7. Return token for auto-login

### Logout

```javascript
const handleLogout = async () => {
  // 1. Sign out from Firebase
  await signOut(auth);

  // 2. Clear user from context
  logout();

  // 3. Navigate to login
  navigate('/login');
};
```

## Security Best Practices

### Password Security
- **Hashing**: Bcrypt with salt rounds = 10
- **Minimum Length**: 8 characters
- **No Plain Text**: Passwords never stored in plain text
- **Reset Flow**: Secure password reset via email (if enabled)

### Session Management
- **Authenticated Users**: Firebase Auth handles session (token refresh)
- **Guests**: localStorage with 60-minute expiration
- **Timeout**: Sessions expire after inactivity (configurable)

### Token Security
- **Custom Tokens**: Expire after 1 hour (Firebase default)
- **Refresh**: Firebase SDK auto-refreshes tokens
- **Claims**: Updated on next login (not real-time)

### Rate Limiting
- **Login Attempts**: Lock account after 5 failed attempts
- **Guest Orders**: 1 order per session
- **API Calls**: Cloud Functions have built-in rate limits

### Audit Logging
- **Super Admin Actions**: All logged to `audit_logs`
- **Sensitive Operations**: Order edits, user deletions tracked
- **IP Address**: Captured for security analysis

## Troubleshooting

### "User not found" error
- Check username spelling (case-sensitive)
- Verify user exists in correct restaurant
- Ensure user status is "active"

### "Permission denied" error
- Check Firestore security rules
- Verify custom claims are set correctly
- Ensure `restaurantId` matches

### Token expired
- Firebase auto-refreshes tokens
- If manual refresh needed: `await auth.currentUser.getIdToken(true)`

### Multi-restaurant switching not working
- Verify `restaurantIds` array contains target restaurant
- Call `setActiveRestaurant` Cloud Function
- Refresh page or re-login to update claims
