# Frontend Guide - React Application

## Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Context Providers](#context-providers)
- [Components](#components)
- [Pages](#pages)
- [Services](#services)
- [Routing & Navigation](#routing--navigation)
- [Styling Approach](#styling-approach)
- [State Management](#state-management)
- [Real-Time Updates](#real-time-updates)
- [Best Practices](#best-practices)

## Overview

The frontend is a modern React single-page application (SPA) built with Vite. It provides interfaces for:
- **Super Admins**: Platform management and restaurant oversight
- **Restaurant Staff**: Order management, kitchen display, menu editing, user management
- **Clients**: Menu browsing, cart management, order placement, order history
- **Guests**: QR code self-service ordering without authentication

**File Location**: `/Users/elmehdimotaqi/Documents/Fasr food project/frontend/`

---

## Technology Stack

### Core Libraries
- **React**: 18.x (with Hooks)
- **React Router DOM**: v6 (client-side routing)
- **Vite**: 5.4.x (build tool & dev server)
- **Firebase**: 10.x (Auth, Firestore, Functions, Messaging)

### UI Libraries
- **Material-UI (MUI)**: v7 (component library)
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Modules**: Scoped CSS for components

### State Management
- **React Context API**: Global state (auth, cart, theme, settings, sidebar)
- **Local State**: Component-level state with `useState`
- **Firestore Listeners**: Real-time database updates

### Additional Libraries
- **qrcode**: QR code generation
- **react-dnd**: Drag-and-drop for kitchen display

### Development Tools
- **ESLint**: Code linting
- **npm**: Package manager

---

## Project Structure

```
frontend/
├── public/                  # Static assets
│   ├── index.html
│   └── favicon.ico
│
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   ├── ProtectedRoute.jsx  # Route guard
│   │   ├── ErrorBoundary.jsx   # Error handling
│   │   ├── Toast.jsx        # Toast notifications
│   │   ├── Modal.jsx        # Modal dialogs
│   │   ├── Button.jsx       # Custom button
│   │   ├── Card.jsx         # Card component
│   │   ├── Navbar.jsx       # Top navbar
│   │   ├── AdminLayout.jsx  # Super admin layout
│   │   ├── UserForm.jsx     # User creation/edit form
│   │   ├── ThemeToggle.jsx  # Dark/light mode toggle
│   │   ├── ConnectionStatus.jsx  # Network status
│   │   ├── ApprovalNotification.jsx  # Order approval alerts
│   │   ├── PrinterConnection.jsx  # Printer setup
│   │   └── PrinterStatus.jsx  # Printer connection indicator
│   │
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.jsx  # Authentication state
│   │   ├── CartContext.jsx  # Shopping cart state
│   │   ├── ThemeContext.jsx # Dark/light mode
│   │   ├── SettingsContext.jsx  # Restaurant settings
│   │   └── SidebarContext.jsx   # Sidebar collapse state
│   │
│   ├── pages/               # Page components
│   │   ├── Login.jsx        # Restaurant user login
│   │   ├── PlatformAdminLogin.jsx  # Super admin login
│   │   ├── Dashboard.jsx    # Analytics dashboard
│   │   ├── Orders.jsx       # Order management
│   │   ├── OrdersHistory.jsx  # Order history
│   │   ├── Kitchen.jsx      # Kitchen display system
│   │   ├── Menu.jsx         # Menu management
│   │   ├── Users.jsx        # User management
│   │   ├── Profile.jsx      # User profile
│   │   ├── CustomerMenuM3.jsx  # Client menu browsing (Material Design 3)
│   │   ├── Cart.jsx         # Shopping cart
│   │   ├── MyOrdersM3.jsx   # Client order history
│   │   ├── ClientProfile.jsx  # Client profile
│   │   ├── GuestOrder.jsx   # Guest self-service ordering
│   │   ├── OrderTracking.jsx  # Guest order tracking
│   │   ├── QRCodeGenerator.jsx  # QR code generator
│   │   └── admin/           # Super admin pages
│   │       ├── Restaurants.jsx  # Restaurant list
│   │       └── CreateRestaurant.jsx  # Create restaurant form
│   │
│   ├── services/            # API services
│   │   ├── firestore.js     # Firestore CRUD operations
│   │   ├── cloudFunctions.js  # Cloud Function calls
│   │   ├── restaurantService.js  # Restaurant APIs
│   │   ├── printerService.js  # Thermal printer integration
│   │   └── ticketFormatter.js  # Receipt formatting
│   │
│   ├── utils/               # Utility functions
│   │   ├── sessionManager.js  # Guest session management
│   │   ├── orderNumberGenerator.js  # Unique order numbers
│   │   └── currency.js      # Currency formatting
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useKioskMode.js  # Kiosk mode functionality
│   │
│   ├── config/              # Configuration
│   │   └── firebase.js      # Firebase initialization
│   │
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
│
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
└── eslint.config.js         # ESLint configuration
```

---

## Context Providers

Context providers manage global state and provide data to all components in the tree.

### 1. AuthContext

**File**: `src/contexts/AuthContext.jsx`

**Purpose**: Manages user authentication state

**Provides**:
```javascript
{
  user: {
    id: string,
    username: string,
    name: string,
    role: "manager" | "cashier" | "cook" | "client",
    phone: string | null,
    restaurantId: string | null,
    isSuperAdmin: boolean
  } | null,
  firebaseUser: FirebaseUser | null,
  loading: boolean,
  error: string | null,
  loginRestaurant: (username, password) => Promise,
  loginSuperAdmin: (username, password) => Promise,
  logout: () => Promise
}
```

**Usage**:
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, loading, loginRestaurant, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Role: {user.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Key Features**:
- Listens to Firebase auth state changes (`onAuthStateChanged`)
- Extracts user info from JWT custom claims
- Provides separate login methods for restaurant users and super admins
- Automatically refreshes token after login
- Handles error messages

**Login Flow**:
1. Call Cloud Function (`authenticateUser` or `authenticateSuperAdmin`)
2. Receive custom auth token
3. Sign in with `signInWithCustomToken`
4. Refresh token to get latest claims
5. `onAuthStateChanged` listener updates user state

---

### 2. ThemeContext

**File**: `src/contexts/ThemeContext.jsx`

**Purpose**: Manages dark/light mode

**Provides**:
```javascript
{
  theme: "light" | "dark",
  toggleTheme: () => void
}
```

**Usage**:
```javascript
import { useTheme } from '../contexts/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
```

**Features**:
- Persists theme to localStorage
- Applies theme class to document root
- Supports CSS custom properties for colors

---

### 3. CartContext

**File**: `src/contexts/CartContext.jsx`

**Purpose**: Manages shopping cart for client users

**Provides**:
```javascript
{
  cart: Array<{
    id: string,
    name: string,
    price: number,
    quantity: number,
    category: string,
    description: string
  }>,
  addToCart: (item) => void,
  removeFromCart: (itemId) => void,
  updateQuantity: (itemId, quantity) => void,
  clearCart: () => void,
  totalAmount: number,
  itemCount: number
}
```

**Usage**:
```javascript
import { useCart } from '../contexts/CartContext';

function MenuItem({ item }) {
  const { addToCart } = useCart();

  return (
    <div>
      <h3>{item.name}</h3>
      <p>{item.price} DH</p>
      <button onClick={() => addToCart(item)}>Add to Cart</button>
    </div>
  );
}
```

**Features**:
- Persists cart to localStorage
- Automatically calculates totals
- Handles quantity updates
- Deduplication (increments quantity if item already in cart)

---

### 4. SettingsContext

**File**: `src/contexts/SettingsContext.jsx`

**Purpose**: Manages restaurant settings (printer config, ticket format, etc.)

**Provides**:
```javascript
{
  settings: {
    ticket: {...},
    printer: {...},
    kitchenDisplay: {...},
    notifications: {...}
  },
  loading: boolean,
  error: string | null,
  updateSettings: (newSettings) => Promise
}
```

**Usage**:
```javascript
import { useSettings } from '../contexts/SettingsContext';

function TicketSettings() {
  const { settings, updateSettings } = useSettings();

  const handleSave = async () => {
    await updateSettings({
      ticket: {
        ...settings.ticket,
        footerMessage: 'Thank you!'
      }
    });
  };

  return <div>...</div>;
}
```

**Features**:
- Loads settings from Firestore on mount
- Real-time listener for settings updates
- Validates restaurant ID before loading

---

### 5. SidebarContext

**File**: `src/contexts/SidebarContext.jsx`

**Purpose**: Manages sidebar collapse state

**Provides**:
```javascript
{
  isCollapsed: boolean,
  toggleSidebar: () => void
}
```

**Usage**:
```javascript
import { useSidebar } from '../contexts/SidebarContext';

function StaffLayout({ children }) {
  const { isCollapsed } = useSidebar();

  return (
    <main className={isCollapsed ? 'md:ml-20' : 'md:ml-64'}>
      {children}
    </main>
  );
}
```

---

## Components

### 1. Sidebar

**File**: `src/components/Sidebar.jsx`

**Purpose**: Navigation sidebar for restaurant staff

**Features**:
- Role-based menu items
- Collapsible on mobile/desktop
- Active route highlighting
- Logout button
- Theme toggle

**Navigation Items** (by role):
```javascript
// Manager
- Dashboard
- Orders
- Kitchen
- Menu
- Users
- QR Generator
- Profile

// Cashier
- Orders
- Kitchen
- Menu
- QR Generator
- Profile

// Cook
- Kitchen
- Profile

// Client
- (Uses ClientLayout instead)
```

---

### 2. ProtectedRoute

**File**: `src/components/ProtectedRoute.jsx`

**Purpose**: Route guard for authentication and authorization

**Props**:
```typescript
{
  children: ReactNode,
  allowedRoles?: string[]  // Optional role whitelist
}
```

**Usage**:
```javascript
<Route path="/dashboard" element={
  <ProtectedRoute allowedRoles={['manager']}>
    <Dashboard />
  </ProtectedRoute>
} />
```

**Logic**:
1. Check if user is authenticated
2. If not → redirect to `/login`
3. If `allowedRoles` provided, check if user's role is allowed
4. If not allowed → show "Access Denied" message
5. If allowed → render children

---

### 3. ErrorBoundary

**File**: `src/components/ErrorBoundary.jsx`

**Purpose**: Catches React errors and displays fallback UI

**Usage**:
```javascript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Features**:
- Catches errors in component tree
- Displays user-friendly error message
- Prevents entire app crash
- Logs error to console

---

### 4. Toast

**File**: `src/components/Toast.jsx`

**Purpose**: Toast notifications for success/error messages

**Props**:
```typescript
{
  message: string,
  type: "success" | "error" | "info" | "warning",
  duration?: number,  // Auto-hide after ms
  onClose: () => void
}
```

**Usage**:
```javascript
const [toast, setToast] = useState(null);

const showToast = (message, type) => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
};

return (
  <>
    <button onClick={() => showToast('Saved!', 'success')}>Save</button>
    {toast && <Toast {...toast} onClose={() => setToast(null)} />}
  </>
);
```

---

### 5. Modal

**File**: `src/components/Modal.jsx`

**Purpose**: Reusable modal dialog

**Props**:
```typescript
{
  isOpen: boolean,
  onClose: () => void,
  title?: string,
  children: ReactNode,
  size?: "sm" | "md" | "lg"
}
```

**Usage**:
```javascript
const [isOpen, setIsOpen] = useState(false);

return (
  <>
    <button onClick={() => setIsOpen(true)}>Open Modal</button>
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="User Details">
      <p>Modal content here...</p>
    </Modal>
  </>
);
```

---

## Pages

### Staff Pages

#### 1. Login (Restaurant Users)

**File**: `src/pages/Login.jsx`

**Route**: `/login`

**Features**:
- Username/password authentication
- Calls `loginRestaurant` from AuthContext
- Redirects based on role:
  - Manager → `/dashboard`
  - Cashier/Cook → `/orders`
  - Client → `/menu` (client interface)
- Error handling with toast messages

**Form Fields**:
- Username (text input)
- Password (password input)

---

#### 2. PlatformAdminLogin (Super Admin)

**File**: `src/pages/PlatformAdminLogin.jsx`

**Route**: `/admin/login`

**Features**:
- Separate login for super admins
- Calls `loginSuperAdmin` from AuthContext
- Redirects to `/admin/restaurants`
- Enhanced security (stronger password requirements)

---

#### 3. Orders

**File**: `src/pages/Orders.jsx`

**Route**: `/orders`

**Allowed Roles**: Manager, Cashier

**Features**:
- Create new orders (staff-created)
- View all orders (today's orders by default)
- Approve/reject guest orders
- Update order status
- Edit orders (staff-created only)
- Print receipts
- Filter by status, date range
- Real-time updates via Firestore listeners

**Actions**:
- Create Order → Opens modal with menu item selection
- Approve Guest Order → Changes status from `awaiting_approval` to `pending`
- Reject Guest Order → Prompts for reason, sets status to `rejected`
- Edit Order → Opens edit modal (only for staff-created, unpaid orders)
- Print Receipt → Sends to thermal printer

---

#### 4. Kitchen

**File**: `src/pages/Kitchen.jsx`

**Route**: `/kitchen`

**Allowed Roles**: Manager, Cashier, Cook

**Features**:
- Kanban-style board: Pending | Preparing | Ready
- Drag-and-drop to update status
- Real-time order updates
- Audio notifications for new orders
- Fullscreen mode
- Filter by order type
- Auto-refresh

**Columns**:
1. **Pending**: Orders approved, not yet started
2. **Preparing**: Orders being cooked
3. **Ready**: Orders ready for pickup/delivery

**Drag & Drop**:
- Drag order card from one column to another
- Automatically updates order status in Firestore
- Immediate visual feedback

---

#### 5. Menu

**File**: `src/pages/Menu.jsx`

**Route**: `/menu`

**Allowed Roles**: Manager, Cashier

**Features**:
- View all menu items
- Create new menu items
- Edit existing items
- Toggle availability
- Delete items
- Categories: Burgers, Sides, Drinks, Desserts, etc.
- Image upload support

**Menu Item Fields**:
- Name
- Description
- Price
- Category
- Image URL (optional)
- Is Available (toggle)

---

#### 6. Users

**File**: `src/pages/Users.jsx`

**Route**: `/users`

**Allowed Roles**: Manager only

**Features**:
- View all users in restaurant
- Create new users
- Edit user details
- Change user role
- Activate/deactivate users
- Delete users

**User Roles** (can create):
- Manager
- Cashier
- Cook
- Client

---

#### 7. Dashboard

**File**: `src/pages/Dashboard.jsx`

**Route**: `/dashboard`

**Allowed Roles**: Manager only

**Features**:
- Total revenue (today, week, month)
- Order count
- Popular menu items
- Order status distribution (pie chart)
- Revenue trends (line chart)
- Payment method breakdown

**Analytics Widgets**:
- Revenue Card
- Orders Card
- Top Items List
- Status Chart
- Revenue Chart

---

#### 8. QRCodeGenerator

**File**: `src/pages/QRCodeGenerator.jsx`

**Route**: `/qr-generator`

**Allowed Roles**: Manager, Cashier

**Features**:
- Generate general QR codes (for takeout/pickup)
- Generate table-specific QR codes (for dine-in)
- Preview QR code
- Download as PNG
- Print QR code with restaurant branding

**QR Code Types**:
1. General: `/guest/{restaurantCode}`
2. Table: `/guest/{restaurantCode}/table/{tableNumber}`

---

### Client Pages

#### 9. CustomerMenuM3

**File**: `src/pages/CustomerMenuM3.jsx`

**Route**: `/menu` (client interface)

**Allowed Roles**: Client

**Features**:
- Browse restaurant menu
- Search/filter by category
- Add items to cart
- View cart preview
- Material Design 3 styling

---

#### 10. Cart

**File**: `src/pages/Cart.jsx`

**Route**: `/cart`

**Allowed Roles**: Client

**Features**:
- View cart items
- Update quantities
- Remove items
- Add order notes
- Place order
- Calculates total automatically

---

#### 11. MyOrdersM3

**File**: `src/pages/MyOrdersM3.jsx`

**Route**: `/my-orders`

**Allowed Roles**: Client

**Features**:
- View order history
- Track order status in real-time
- Filter by status
- Order details modal

---

### Guest Pages

#### 12. GuestOrder

**File**: `src/pages/GuestOrder.jsx`

**Route**: `/guest/:restaurantCode` or `/guest/:restaurantCode/table/:tableNumber`

**Auth Required**: No

**Features**:
- Session-based ordering (60 minutes)
- Collect guest info (name, phone, order type, table)
- Browse menu
- Add items to cart
- Place order (status: `awaiting_approval`)
- Redirect to order tracking

**Steps**:
1. Session initialization
2. Guest info form
3. Menu browsing & cart
4. Order placement
5. Redirect to tracking page

---

#### 13. OrderTracking

**File**: `src/pages/OrderTracking.jsx`

**Route**: `/track/:orderId/:trackingSecret`

**Auth Required**: No

**Features**:
- Real-time order status updates
- Progress bar
- Guest info display
- Order items list
- Thank you modal when completed
- Auto session cleanup

---

### Super Admin Pages

#### 14. Restaurants

**File**: `src/pages/admin/Restaurants.jsx`

**Route**: `/admin/restaurants`

**Allowed Roles**: Super Admin only

**Features**:
- List all restaurants
- View restaurant details
- Suspend/activate restaurants
- Edit restaurant info
- Create new restaurant (redirect to `/admin/restaurants/create`)

---

#### 15. CreateRestaurant

**File**: `src/pages/admin/CreateRestaurant.jsx`

**Route**: `/admin/restaurants/create`

**Allowed Roles**: Super Admin only

**Features**:
- Create new restaurant
- Set plan (Basic, Pro, Enterprise)
- Create admin user for restaurant
- Generate restaurant code

---

## Services

### 1. firestore.js

**File**: `src/services/firestore.js`

**Purpose**: Firestore CRUD operations

**Exports**:
```javascript
{
  // Orders
  orderService: {
    getAll: (restaurantId) => Promise<Order[]>,
    getById: (orderId) => Promise<Order>,
    create: (orderData) => Promise<string>,
    update: (orderId, updates) => Promise<void>,
    delete: (orderId) => Promise<void>,
    listen: (restaurantId, callback) => () => void
  },

  // Menu
  menuService: {
    getAll: (restaurantId) => Promise<MenuItem[]>,
    getAvailable: (restaurantId) => Promise<MenuItem[]>,
    create: (menuItemData) => Promise<string>,
    update: (itemId, updates) => Promise<void>,
    delete: (itemId) => Promise<void>
  },

  // Users
  userService: {
    getAll: (restaurantId) => Promise<User[]>,
    getById: (userId) => Promise<User>,
    create: (userData) => Promise<string>,
    update: (userId, updates) => Promise<void>,
    delete: (userId) => Promise<void>
  }
}
```

**Usage**:
```javascript
import { orderService, menuService } from '../services/firestore';

// Get all orders for restaurant
const orders = await orderService.getAll(restaurantId);

// Listen to real-time updates
const unsubscribe = orderService.listen(restaurantId, (orders) => {
  setOrders(orders);
});

// Cleanup
return () => unsubscribe();
```

---

### 2. cloudFunctions.js

**File**: `src/services/cloudFunctions.js`

**Purpose**: Cloud Function calls

**Exports**:
```javascript
{
  authenticateUser: (username, password) => Promise,
  authenticateSuperAdmin: (username, password) => Promise,
  createUser: (userData) => Promise,
  updateUser: (userId, updates) => Promise,
  deleteUser: (userId) => Promise,
  createRestaurant: (restaurantData) => Promise,
  updateRestaurant: (restaurantId, updates) => Promise,
  // ... more functions
}
```

**Usage**:
```javascript
import { createUser } from '../services/cloudFunctions';

const handleCreateUser = async (formData) => {
  try {
    const result = await createUser({
      username: formData.username,
      password: formData.password,
      role: formData.role,
      name: formData.name,
      phone: formData.phone
    });

    console.log('User created:', result.userId);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

### 3. printerService.js

**File**: `src/services/printerService.js`

**Purpose**: Thermal printer integration

**Features**:
- Connect to USB thermal printer
- Print kitchen tickets
- Print customer receipts
- Format tickets with receipt formatter

**Main Functions**:
```javascript
{
  connectPrinter: (vendorId, productId) => Promise,
  printKitchenTicket: (order, settings) => Promise,
  printCustomerReceipt: (order, settings) => Promise,
  isPrinterConnected: () => boolean
}
```

---

## Routing & Navigation

### Route Structure

**File**: `src/App.jsx`

```javascript
<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/admin/login" element={<PlatformAdminLogin />} />
  <Route path="/guest/:restaurantCode" element={<GuestOrder />} />
  <Route path="/guest/:restaurantCode/table/:tableNumber" element={<GuestOrder />} />
  <Route path="/track/:orderId/:secret" element={<OrderTracking />} />

  {/* Staff Routes */}
  <Route path="/dashboard" element={
    <ProtectedRoute allowedRoles={['manager']}>
      <StaffLayout><Dashboard /></StaffLayout>
    </ProtectedRoute>
  } />

  <Route path="/orders" element={
    <ProtectedRoute allowedRoles={['manager', 'cashier']}>
      <StaffLayout><Orders /></StaffLayout>
    </ProtectedRoute>
  } />

  <Route path="/kitchen" element={
    <ProtectedRoute allowedRoles={['manager', 'cashier', 'cook']}>
      <StaffLayout><Kitchen /></StaffLayout>
    </ProtectedRoute>
  } />

  {/* Client Routes */}
  <Route path="/menu" element={
    <ProtectedRoute allowedRoles={['client']}>
      <ClientLayout><CustomerMenuM3 /></ClientLayout>
    </ProtectedRoute>
  } />

  {/* Super Admin Routes */}
  <Route path="/admin/restaurants" element={
    <ProtectedRoute allowedRoles={['superAdmin']}>
      <AdminLayout><Restaurants /></AdminLayout>
    </ProtectedRoute>
  } />

  {/* 404 */}
  <Route path="*" element={<Navigate to="/login" />} />
</Routes>
```

### Layout Components

**StaffLayout**: Sidebar + main content area for restaurant staff

**ClientLayout**: Material Design 3 layout for client users

**AdminLayout**: Super admin layout with top navbar

---

## Styling Approach

### 1. Tailwind CSS

**Config**: `tailwind.config.js`

**Usage**:
```javascript
<div className="flex items-center justify-between p-4 bg-blue-500 text-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold">Title</h1>
  <button className="px-4 py-2 bg-white text-blue-500 rounded hover:bg-gray-100">
    Action
  </button>
</div>
```

**Utility Classes**:
- **Layout**: `flex`, `grid`, `container`
- **Spacing**: `p-4`, `m-2`, `space-x-4`
- **Colors**: `bg-blue-500`, `text-white`
- **Typography**: `text-2xl`, `font-bold`
- **Responsive**: `md:hidden`, `lg:flex`

---

### 2. CSS Modules

**File Naming**: `ComponentName.module.css`

**Usage**:
```javascript
// OrderTracking.module.css
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.card {
  max-width: 600px;
  background: white;
  border-radius: 12px;
}

// OrderTracking.jsx
import styles from './OrderTracking.module.css';

<div className={styles.container}>
  <div className={styles.card}>
    ...
  </div>
</div>
```

**Benefits**:
- Scoped styles (no global conflicts)
- Easy to maintain
- Works alongside Tailwind

---

### 3. CSS Custom Properties

**File**: `src/index.css`

**Theme Variables**:
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent-color: #3498db;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
}
```

**Usage**:
```css
.header {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

---

## State Management

### Local State (useState)

**Use Case**: Component-specific state

**Example**:
```javascript
function OrderForm() {
  const [customerName, setCustomerName] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Component logic...
}
```

---

### Context State

**Use Case**: Global state shared across multiple components

**Example**:
```javascript
// AuthContext provides user state globally
const { user } = useAuth();

// CartContext provides cart state globally
const { cart, addToCart } = useCart();
```

---

### Firestore Real-Time State

**Use Case**: Data synchronized with Firestore

**Example**:
```javascript
const [orders, setOrders] = useState([]);

useEffect(() => {
  const unsubscribe = orderService.listen(restaurantId, (newOrders) => {
    setOrders(newOrders);
  });

  return () => unsubscribe();
}, [restaurantId]);
```

---

## Real-Time Updates

### Firestore Listeners

**Pattern**:
```javascript
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

useEffect(() => {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('restaurantId', '==', restaurantId),
    where('status', '!=', 'completed')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const newOrders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setOrders(newOrders);
  });

  return () => unsubscribe(); // Cleanup on unmount
}, [restaurantId]);
```

**Use Cases**:
- Kitchen display (orders update in real-time)
- Order tracking (status changes instantly)
- Menu availability (items toggle live)
- User list (new users appear immediately)

---

## Best Practices

### 1. Component Organization

```javascript
// ✅ Good: Clear component structure
function OrderCard({ order, onStatusChange }) {
  // State
  const [isExpanded, setIsExpanded] = useState(false);

  // Effects
  useEffect(() => {
    // Side effects here
  }, []);

  // Handlers
  const handleExpand = () => setIsExpanded(!isExpanded);

  // Render
  return (
    <div className={styles.card}>
      {/* JSX */}
    </div>
  );
}
```

---

### 2. Error Handling

```javascript
// ✅ Good: Try-catch with user feedback
const handleSubmit = async () => {
  try {
    setLoading(true);
    await orderService.create(orderData);
    showToast('Order created successfully', 'success');
  } catch (error) {
    console.error('Error creating order:', error);
    showToast(error.message || 'Failed to create order', 'error');
  } finally {
    setLoading(false);
  }
};
```

---

### 3. Loading States

```javascript
// ✅ Good: Show loading indicators
if (loading) {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}

return <ActualContent />;
```

---

### 4. Cleanup Effects

```javascript
// ✅ Good: Always cleanup listeners
useEffect(() => {
  const unsubscribe = onSnapshot(ordersRef, handleSnapshot);
  return () => unsubscribe(); // Cleanup
}, []);
```

---

### 5. Prop Validation

```javascript
// ✅ Good: Destructure and validate props
function MenuItem({ item }) {
  if (!item) return null;

  const { name, price, description, category } = item;

  return (
    <div>
      <h3>{name}</h3>
      <p>{description}</p>
      <span>{price} DH</span>
    </div>
  );
}
```

---

### 6. Conditional Rendering

```javascript
// ✅ Good: Early returns for edge cases
if (!user) return <Navigate to="/login" />;
if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;

return <MainContent />;
```

---

### 7. Memoization for Performance

```javascript
import { useMemo } from 'react';

function OrderList({ orders }) {
  // ✅ Memoize expensive calculations
  const pendingOrders = useMemo(() => {
    return orders.filter(order => order.status === 'pending');
  }, [orders]);

  return <div>{pendingOrders.map(order => <OrderCard key={order.id} order={order} />)}</div>;
}
```

---

### 8. Key Props in Lists

```javascript
// ✅ Good: Use unique IDs as keys
{orders.map(order => (
  <OrderCard key={order.id} order={order} />
))}

// ❌ Bad: Using index as key
{orders.map((order, index) => (
  <OrderCard key={index} order={order} />
))}
```

---

### 9. Avoid Inline Functions

```javascript
// ✅ Good: Define handlers outside JSX
const handleClick = () => {
  console.log('Clicked');
};

<button onClick={handleClick}>Click Me</button>

// ❌ Bad: Inline arrow functions
<button onClick={() => console.log('Clicked')}>Click Me</button>
```

---

### 10. Use Constants

```javascript
// ✅ Good: Define constants
const ORDER_STATUSES = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed'
};

const statusColor = {
  [ORDER_STATUSES.PENDING]: 'yellow',
  [ORDER_STATUSES.PREPARING]: 'blue',
  [ORDER_STATUSES.READY]: 'green',
  [ORDER_STATUSES.COMPLETED]: 'gray'
};
```

---

## Related Documentation

- [Technical Overview](./TECHNICAL_OVERVIEW.md) - System architecture
- [API Reference](./API_REFERENCE.md) - Cloud Functions
- [Database Schema](./DATABASE_SCHEMA.md) - Firestore structure
- [Authentication Guide](./AUTHENTICATION_GUIDE.md) - Auth flows
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production deployment
