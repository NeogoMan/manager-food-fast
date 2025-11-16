# Guest Self-Service System - QR Code Ordering

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [QR Code Generation](#qr-code-generation)
- [Session Management](#session-management)
- [Guest Ordering Flow](#guest-ordering-flow)
- [Order Tracking](#order-tracking)
- [Security Considerations](#security-considerations)
- [Implementation Details](#implementation-details)
- [Common Scenarios](#common-scenarios)

## Overview

The Guest Self-Service System allows customers to order food without creating an account or installing an app. Customers simply scan a QR code, browse the menu, place an order, and track its progress in real-time.

### Key Features
- **No Authentication Required**: Guests don't need to sign up or log in
- **QR Code Access**: Instant access via table-specific or general QR codes
- **Session-Based**: 60-minute localStorage sessions
- **Order Approval**: Staff must approve guest orders before preparation
- **Real-Time Tracking**: Guests can track order status with a secret URL
- **Single Order Per Session**: Prevents duplicate orders
- **Automatic Session Cleanup**: Sessions expire after 60 minutes

### Use Cases
1. **Dine-In Customers**: Scan QR code on table, order, and track
2. **Takeout Customers**: Scan general QR code, order for pickup
3. **Walk-In Customers**: Browse menu and place order without waiting for staff

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GUEST ORDERING FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Scan QR Code                                             │
│     ↓                                                        │
│  2. Create 60-minute Session (localStorage)                  │
│     ↓                                                        │
│  3. Enter Name & Phone (optional)                            │
│     ↓                                                        │
│  4. Browse Menu                                              │
│     ↓                                                        │
│  5. Add Items to Cart                                        │
│     ↓                                                        │
│  6. Add Notes (optional, max 50 chars)                       │
│     ↓                                                        │
│  7. Place Order → Status: awaiting_approval                  │
│     ↓                                                        │
│  8. Staff Approves → Status: pending                         │
│     ↓                                                        │
│  9. Kitchen Prepares → Status: preparing                     │
│     ↓                                                        │
│ 10. Order Ready → Status: ready                              │
│     ↓                                                        │
│ 11. Customer Receives → Status: completed                    │
│     ↓                                                        │
│ 12. Thank You Modal + Session Cleanup                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Guest Scans │         │  Web Browser │         │  Firestore   │
│   QR Code    │────────▶│  (Frontend)  │◀───────▶│  Database    │
└──────────────┘         └──────────────┘         └──────────────┘
                                │
                                │
                         ┌──────┴──────┐
                         │             │
                    ┌────▼────┐   ┌────▼────┐
                    │localStorage│   │Real-time│
                    │  Session  │   │Listener │
                    └───────────┘   └─────────┘
```

## QR Code Generation

### QR Code Types

The system supports two types of QR codes:

#### 1. General QR Code
- **Purpose**: Takeout, pickup, or general ordering
- **URL Format**: `https://yourdomain.com/guest/{restaurantCode}`
- **Example**: `https://yourdomain.com/guest/BURGER01`
- **Use Case**: Display at entrance, counter, or on flyers

#### 2. Table-Specific QR Code
- **Purpose**: Dine-in customers at specific tables
- **URL Format**: `https://yourdomain.com/guest/{restaurantCode}/table/{tableNumber}`
- **Example**: `https://yourdomain.com/guest/BURGER01/table/5`
- **Use Case**: Printed on table tents or placards

### Generating QR Codes

**File**: `frontend/src/pages/QRCodeGenerator.jsx`

**How to Generate**:
1. Navigate to `/qr-generator` (Manager or Cashier role required)
2. Select QR code type (General or Table-specific)
3. If table-specific, enter table number
4. Click "Générer le QR Code"
5. Download as PNG or print directly

**Code Example**:
```javascript
// Generate QR code using qrcode library
const baseUrl = window.location.origin;
let guestUrl;

if (qrType === 'table') {
  guestUrl = `${baseUrl}/guest/${restaurant.shortCode}/table/${tableNumber}`;
} else {
  guestUrl = `${baseUrl}/guest/${restaurant.shortCode}`;
}

const qrDataUrl = await QRCode.toDataURL(guestUrl, {
  width: 400,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});
```

**QR Code Properties**:
- **Size**: 400x400 pixels
- **Margin**: 2 modules
- **Color**: Black on white
- **Format**: PNG (Data URL)
- **Error Correction**: Default (M level)

### Restaurant Short Codes

Each restaurant has a unique short code (e.g., `BURGER01`, `PIZZA02`) stored in the `restaurants` collection. This code is used in the QR code URL.

**Example Restaurant Document**:
```javascript
{
  id: "rest_abc123xyz",
  name: "Fast Burger",
  shortCode: "BURGER01", // ← Used in QR code URL
  acceptingOrders: true
}
```

## Session Management

**File**: `frontend/src/utils/sessionManager.js`

### Session Structure

Guest sessions are stored in localStorage and have the following structure:

```javascript
{
  sessionId: "session_1705308000123_a1b2c3d4e5",
  restaurantCode: "BURGER01",
  startTime: 1705308000123,
  guestInfo: {
    name: "Jane Doe",
    phone: "+212 6XX XXX XXX",
    orderType: "dine-in",
    tableNumber: "5"
  }
}
```

### Session Configuration

| Property | Value | Description |
|----------|-------|-------------|
| Duration | 60 minutes | Session expires after 60 minutes |
| Storage | localStorage | Browser localStorage (client-side only) |
| Session Key | `guest_session` | Key used to store session in localStorage |
| Cart Key | `guest_cart_{sessionId}` | Key used to store cart items |
| Order Flag Key | `order_placed_{sessionId}` | Prevents duplicate orders |

### Key Functions

#### 1. `createSession(restaurantCode)`
Creates a new guest session.

```javascript
const session = sessionManager.createSession('BURGER01');
// Returns:
{
  sessionId: "session_1705308000123_a1b2c3d4e5",
  restaurantCode: "BURGER01",
  startTime: 1705308000123,
  guestInfo: null
}
```

#### 2. `isSessionValid()`
Checks if the current session is still valid (not expired).

```javascript
const isValid = sessionManager.isSessionValid();
// Returns: true if session exists and elapsed time < 60 minutes
```

#### 3. `getTimeRemaining()`
Returns remaining time in milliseconds.

```javascript
const remaining = sessionManager.getTimeRemaining();
// Returns: 3600000 (1 hour) down to 0
```

#### 4. `getFormattedTimeRemaining()`
Returns human-readable time remaining.

```javascript
const formatted = sessionManager.getFormattedTimeRemaining();
// Returns: "45m" or "30s"
```

#### 5. `isSessionExpiringSoon()`
Returns true if less than 5 minutes remaining.

```javascript
const expiringSoon = sessionManager.isSessionExpiringSoon();
// Returns: true if remaining < 5 minutes
```

#### 6. `updateGuestInfo(guestInfo)`
Saves guest information to the session.

```javascript
sessionManager.updateGuestInfo({
  name: "Jane Doe",
  phone: "+212 6XX XXX XXX",
  orderType: "dine-in",
  tableNumber: "5"
});
```

#### 7. `clearSession()`
Clears the session, cart, and order placed flag.

```javascript
sessionManager.clearSession();
// Removes:
// - guest_session
// - guest_cart_{sessionId}
// - order_placed_{sessionId}
```

### Cart Management

#### `getCart()` / `saveCart(cart)`
Manages the shopping cart for the current session.

```javascript
// Get cart
const cart = sessionManager.getCart();
// Returns: []

// Save cart
sessionManager.saveCart([
  { id: 'menu_001', name: 'Burger', price: 8.99, quantity: 2 },
  { id: 'menu_002', name: 'Fries', price: 3.99, quantity: 1 }
]);
```

**Cart Item Structure**:
```javascript
{
  id: "menu_burger001",        // Menu item ID
  name: "Classic Burger",      // Item name
  price: 8.99,                 // Unit price
  quantity: 2,                 // Quantity
  description: "...",          // Item description (optional)
  category: "Burgers"          // Category (optional)
}
```

### Tracking Secret & Duplicate Prevention

#### `generateTrackingSecret()`
Generates a random UUID-like secret for order tracking.

```javascript
const secret = sessionManager.generateTrackingSecret();
// Returns: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
```

#### `setOrderPlaced(trackingUrl)` / `getOrderPlacedUrl()`
Prevents duplicate orders by marking session as used.

```javascript
// After placing order
sessionManager.setOrderPlaced('/track/order_123/secret_abc');

// Check if order already placed
const trackingUrl = sessionManager.getOrderPlacedUrl();
if (trackingUrl) {
  navigate(trackingUrl); // Redirect to existing order
}
```

### Session Lifecycle

```
1. QR Code Scanned
   ↓
2. createSession('BURGER01')
   ↓
3. Session Active (60 min timer starts)
   ↓
4. updateGuestInfo({...})
   ↓
5. saveCart([...])
   ↓
6. Place Order → setOrderPlaced('/track/...')
   ↓
7. Order Completed → clearSession()
   ↓
8. Session Ended
```

## Guest Ordering Flow

**File**: `frontend/src/pages/GuestOrder.jsx`

### Step-by-Step Flow

#### Step 1: QR Code Scan → Session Initialization

When a guest scans a QR code, they're directed to:
- General: `/guest/{restaurantCode}`
- Table: `/guest/{restaurantCode}/table/{tableNumber}`

**What Happens**:
1. Extract `restaurantCode` and optional `tableNumber` from URL
2. Check if valid session exists for this restaurant
3. If no session or expired/different restaurant → create new session
4. Query Firestore for restaurant by `shortCode`
5. Validate restaurant exists and `acceptingOrders === true`

**Code Flow** (GuestOrder.jsx:83-151):
```javascript
const initializeSession = async () => {
  // 1. Validate restaurant code
  if (!restaurantCode) {
    setRestaurantError('Code restaurant invalide');
    setCurrentStep('error');
    return;
  }

  // 2. Check or create session
  let session = sessionManager.getSession();
  if (!session ||
      session.restaurantCode !== restaurantCode.toUpperCase() ||
      !sessionManager.isSessionValid()) {
    sessionManager.clearSession();
    session = sessionManager.createSession(restaurantCode);
  }

  // 3. Check expiration
  if (!sessionManager.isSessionValid()) {
    setIsSessionExpired(true);
    setCurrentStep('expired');
    return;
  }

  // 4. Load restaurant by shortCode
  const restaurantsRef = collection(db, 'restaurants');
  const q = query(
    restaurantsRef,
    where('shortCode', '==', restaurantCode.toUpperCase())
  );
  const querySnapshot = await getDocs(q);

  // 5. Validate restaurant
  if (querySnapshot.empty) {
    setRestaurantError('Restaurant non trouvé');
    setCurrentStep('error');
    return;
  }

  const restaurantData = { id: restaurantDoc.id, ...restaurantDoc.data() };

  // 6. Check if accepting orders
  if (!restaurantData.acceptingOrders) {
    setCurrentStep('closed');
    return;
  }

  setRestaurant(restaurantData);
  setCurrentStep('info');
};
```

**Possible Outcomes**:
- ✅ Success → Show guest info form (`currentStep = 'info'`)
- ❌ Restaurant not found → Show error page
- ❌ Restaurant closed → Show "Restaurant fermé" page
- ❌ Session expired → Show session expired page

---

#### Step 2: Guest Information Collection

**What Guest Provides**:
- **Name** (required, min 2 characters)
- **Phone** (optional, for notifications)
- **Order Type** (required):
  - `dine-in` - Sur place (requires table number)
  - `takeout` - À emporter
  - `pickup` - Enlèvement
- **Table Number** (required if dine-in, pre-filled from URL if available)

**UI** (GuestOrder.jsx:376-439):
```jsx
<form onSubmit={handleInfoSubmit}>
  <input
    type="text"
    value={guestName}
    onChange={(e) => setGuestName(e.target.value)}
    placeholder="Ex: Mohammed"
    required
    minLength={2}
  />

  <input
    type="tel"
    value={guestPhone}
    onChange={(e) => setGuestPhone(e.target.value)}
    placeholder="Ex: +212 6XX XXX XXX"
  />

  <select
    value={orderType}
    onChange={(e) => setOrderType(e.target.value)}
  >
    <option value="dine-in">Sur place</option>
    <option value="takeout">À emporter</option>
    <option value="pickup">Enlèvement</option>
  </select>

  {orderType === 'dine-in' && (
    <input
      type="text"
      value={tableNum}
      placeholder="Ex: 5"
      required
    />
  )}

  <button type="submit">Commencer ma commande →</button>
</form>
```

**Validation** (GuestOrder.jsx:153-179):
- Name cannot be empty
- Table number required for dine-in orders
- Guest info saved to session via `sessionManager.updateGuestInfo()`

**What Happens on Submit**:
1. Validate inputs
2. Save guest info to session
3. Load menu items from Firestore
4. Navigate to menu browsing step

---

#### Step 3: Menu Browsing & Cart Management

**Menu Loading** (GuestOrder.jsx:181-192):
```javascript
const loadMenu = async () => {
  setMenuLoading(true);
  const items = await menuService.getAvailable(restaurant.id);
  // Returns only available items for this restaurant
  setMenuItems(items);
  setMenuLoading(false);
};
```

**Menu Display** (GuestOrder.jsx:442-477):
- Grid layout of available menu items
- Each item shows: name, description (optional), price
- "+" button to add to cart
- Cart badge shows item count

**Cart Operations**:

**Add to Cart** (GuestOrder.jsx:194-212):
```javascript
const addToCart = (item) => {
  const existingItem = cart.find(cartItem => cartItem.id === item.id);
  let newCart;

  if (existingItem) {
    // Increment quantity if already in cart
    newCart = cart.map(cartItem =>
      cartItem.id === item.id
        ? { ...cartItem, quantity: cartItem.quantity + 1 }
        : cartItem
    );
  } else {
    // Add new item with quantity 1
    newCart = [...cart, { ...item, quantity: 1 }];
  }

  setCart(newCart);
  sessionManager.saveCart(newCart); // Persist to localStorage
  setMessage({ type: 'success', text: `${item.name} ajouté au panier` });
};
```

**Update Quantity** (GuestOrder.jsx:220-231):
```javascript
const updateQuantity = (itemId, newQuantity) => {
  if (newQuantity < 1) {
    removeFromCart(itemId); // Remove if quantity becomes 0
    return;
  }

  const newCart = cart.map(item =>
    item.id === itemId ? { ...item, quantity: newQuantity } : item
  );
  setCart(newCart);
  sessionManager.saveCart(newCart);
};
```

**Remove from Cart** (GuestOrder.jsx:214-218):
```javascript
const removeFromCart = (itemId) => {
  const newCart = cart.filter(item => item.id !== itemId);
  setCart(newCart);
  sessionManager.saveCart(newCart);
};
```

**Calculate Total** (GuestOrder.jsx:233-235):
```javascript
const calculateTotal = () => {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};
```

**Cart Modal** (GuestOrder.jsx:502-580):
- Shows all cart items with quantity controls
- Displays total amount
- Optional order notes (max 50 characters)
- Session expiration warning if < 5 minutes remaining
- "Passer la commande" button to place order

---

#### Step 4: Order Placement

**Place Order Function** (GuestOrder.jsx:237-317):

**Validations**:
1. Check if order already placed for this session → redirect if yes
2. Cart must not be empty
3. Session must not be expired

**Order Creation**:
```javascript
const placeOrder = async () => {
  // 1. Prevent duplicate orders
  const existingOrderUrl = sessionManager.getOrderPlacedUrl();
  if (existingOrderUrl) {
    navigate(existingOrderUrl, { replace: true });
    return;
  }

  // 2. Validate cart and session
  if (cart.length === 0) {
    setMessage({ type: 'error', text: 'Votre panier est vide' });
    return;
  }

  if (!sessionManager.isSessionValid()) {
    setMessage({ type: 'error', text: 'Votre session a expiré.' });
    setCurrentStep('expired');
    return;
  }

  // 3. Generate unique order number (4 digits)
  const orderNumber = await generateUniqueOrderNumber(restaurant.id);

  // 4. Generate tracking secret (UUID)
  const trackingSecret = sessionManager.generateTrackingSecret();

  // 5. Build order document
  const orderData = {
    restaurantId: restaurant.id,
    orderNumber,

    // Guest fields
    isGuestOrder: true,
    guestName: guestName.trim(),
    guestPhone: guestPhone.trim() || null,
    orderType,
    tableNumber: orderType === 'dine-in' ? tableNum.trim() : null,
    notes: orderNotes.trim() || null,

    // Items
    items: cart.map(item => ({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    })),
    totalAmount: calculateTotal(),
    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),

    // Status
    status: 'awaiting_approval', // ← Requires staff approval
    paymentStatus: 'unpaid',

    // Tracking
    trackingSecret,

    // Timestamps
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // 6. Save to Firestore
  const ordersRef = collection(db, 'orders');
  const orderRef = await addDoc(ordersRef, orderData);

  // 7. Build tracking URL
  const trackingUrl = `/track/${orderRef.id}/${trackingSecret}`;

  // 8. Mark order as placed (prevent duplicates)
  sessionManager.setOrderPlaced(trackingUrl);

  // 9. Clear cart
  setCart([]);
  sessionManager.saveCart([]);

  // 10. Redirect to tracking page
  navigate(trackingUrl, { replace: true });
};
```

**Order Document Fields**:
```javascript
{
  id: "order_guest789",              // Auto-generated by Firestore
  restaurantId: "rest_abc123xyz",    // Restaurant ID
  orderNumber: "0847",               // 4-digit unique number

  isGuestOrder: true,                // ← Guest order flag
  guestName: "Jane Doe",             // Guest name
  guestPhone: "+212 6XX XXX XXX",    // Guest phone (optional)
  orderType: "dine-in",              // Order type
  tableNumber: "5",                  // Table (if dine-in)
  notes: "No onions",                // Order notes (max 50 chars)

  items: [
    {
      menuItemId: "menu_burger001",
      name: "Classic Burger",
      price: 8.99,
      quantity: 2,
      subtotal: 17.98
    }
  ],
  totalAmount: 21.97,
  itemCount: 3,

  status: "awaiting_approval",       // ← Initial status
  paymentStatus: "unpaid",

  trackingSecret: "a1b2c3d4-...",    // UUID for tracking

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

#### Step 5: Automatic Redirect to Tracking

After order placement, the guest is automatically redirected to:
```
/track/{orderId}/{trackingSecret}
```

**Example**:
```
/track/order_guest789/a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6
```

- Uses `replace: true` to prevent back button navigation
- Tracking URL stored in session to redirect if user refreshes
- Session cleanup prevented until order completed

## Order Tracking

**File**: `frontend/src/pages/OrderTracking.jsx`

### Tracking URL Structure

```
https://yourdomain.com/track/{orderId}/{trackingSecret}
```

**Example**:
```
https://yourdomain.com/track/order_guest789/a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6
```

**URL Parameters**:
- `orderId` - Firestore document ID of the order
- `trackingSecret` - Random UUID stored in order document

### Real-Time Order Updates

**Firestore Listener** (OrderTracking.jsx:18-70):
```javascript
useEffect(() => {
  if (!orderId || !secret) {
    setError('URL de suivi invalide');
    return;
  }

  // Real-time listener
  const orderRef = doc(db, 'orders', orderId);
  const unsubscribe = onSnapshot(
    orderRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        setError('Commande introuvable');
        return;
      }

      const orderData = { id: snapshot.id, ...snapshot.data() };

      // Validate tracking secret
      if (orderData.trackingSecret !== secret) {
        setError('Lien de suivi invalide');
        return;
      }

      // Validate it's a guest order
      if (!orderData.isGuestOrder) {
        setError('Cette commande n\'est pas une commande self-service');
        return;
      }

      // Detect when order just became completed
      if (orderData.status === 'completed' && !hasShownThankYou.current) {
        hasShownThankYou.current = true;
        setShowThankYou(true); // Show thank you modal
      }

      setOrder(orderData);
      setLoading(false);
    },
    (err) => {
      console.error('Error loading order:', err);
      setError('Erreur de chargement de la commande');
    }
  );

  return () => unsubscribe(); // Cleanup on unmount
}, [orderId, secret]);
```

**Security Validations**:
1. Order must exist in Firestore
2. `trackingSecret` in URL must match order document
3. `isGuestOrder` must be `true`

### Order Status Display

**Status Progression**:
```
awaiting_approval → pending → preparing → ready → completed
       ↓
   rejected (if rejected by staff)
```

**Status Badges** (OrderTracking.jsx:92-132):

| Status | Icon | Text | Color |
|--------|------|------|-------|
| `awaiting_approval` | ⏳ | En attente d'approbation | Yellow |
| `pending` | 📝 | Approuvée | Yellow |
| `preparing` | 👨‍🍳 | En préparation | Blue |
| `ready` | ✅ | Prêt ! | Green (pulsing) |
| `completed` | 🎉 | Terminé | Green |
| `cancelled` | ❌ | Annulée | Red |
| `rejected` | 🚫 | Rejetée | Red |

**Progress Bar** (OrderTracking.jsx:150-165):

| Status | Progress % |
|--------|-----------|
| `awaiting_approval` | 10% |
| `pending` | 25% |
| `preparing` | 60% |
| `ready` | 90% |
| `completed` | 100% |

### Tracking Page Sections

**1. Header** (OrderTracking.jsx:199-203):
- "🔍 Suivi de commande" title
- Order number badge (e.g., #0847)

**2. Ready Alert** (OrderTracking.jsx:206-217):
- Large green banner when status = 'ready'
- ✅ icon with "Votre commande est prête !"
- Table number (if dine-in)
- Pickup instructions (if takeout)

**3. Progress Bar** (OrderTracking.jsx:220-232):
- Visual progress indicator
- Current status badge with icon
- Only shown for active orders (not completed/cancelled/rejected)

**4. Rejection Box** (OrderTracking.jsx:234-240):
- Red alert box if order rejected
- Shows rejection reason from staff

**5. Guest Information** (OrderTracking.jsx:242-253):
- Guest name
- Phone number (if provided)
- Order type (🍽️ Sur place / 📦 À emporter / 🚶 Enlèvement)
- Table number (if dine-in)

**6. Order Notes** (OrderTracking.jsx:255-261):
- Yellow highlighted box
- Shows customer instructions (e.g., "No onions")

**7. Order Items** (OrderTracking.jsx:263-281):
- List of all ordered items
- Item name, quantity, subtotal
- Total amount at bottom

**8. Order Timestamp** (OrderTracking.jsx:283-288):
- "Commandé le {date}" in French locale

**9. Auto-Refresh Notice** (OrderTracking.jsx:291-296):
- "ℹ️ Cette page se met à jour automatiquement"
- Only shown for active orders

### Thank You Modal

**Trigger** (OrderTracking.jsx:52-56):
```javascript
// Detect when order status changes to 'completed'
if (orderData.status === 'completed' && !hasShownThankYou.current) {
  hasShownThankYou.current = true; // Prevent showing multiple times
  setShowThankYou(true);
}
```

**Modal Content** (OrderTracking.jsx:298-330):
- Full-screen dark overlay
- 🎉 animated icon
- "Merci pour votre visite !" message
- Order summary (number & total)
- **5-second countdown** to session cleanup
- "Session se terminera dans {countdown} seconde(s)..."

**Countdown Logic** (OrderTracking.jsx:73-90):
```javascript
useEffect(() => {
  if (!showThankYou) return;

  const interval = setInterval(() => {
    setCountdown((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        // Clear session when countdown reaches 0
        sessionManager.clearSession();
        sessionManager.clearOrderPlaced();
        return 0;
      }
      return prev - 1;
    });
  }, 1000); // Decrease every second

  return () => clearInterval(interval);
}, [showThankYou]);
```

**After Countdown**:
- Session cleared from localStorage
- "Vous pouvez fermer cette page maintenant."
- "Ou scanner le code QR à nouveau pour une nouvelle commande."

## Security Considerations

### 1. No Authentication Required
- Guests don't need Firebase Authentication
- No user accounts created
- No passwords stored

### 2. Tracking Secret Validation
- Each order has a unique UUID tracking secret
- Secret required to view order details
- URL must contain both `orderId` and `trackingSecret`

**Security Check** (OrderTracking.jsx:38-43):
```javascript
// Validate tracking secret
if (orderData.trackingSecret !== secret) {
  setError('Lien de suivi invalide');
  return;
}
```

### 3. Guest Order Validation
Only guest orders can be tracked via public URL.

```javascript
if (!orderData.isGuestOrder) {
  setError('Cette commande n\'est pas une commande self-service');
  return;
}
```

### 4. Approval Workflow
All guest orders require staff approval before preparation.

**Order Lifecycle**:
```
Guest Places Order → awaiting_approval
                           ↓
Staff Reviews Order → approves OR rejects
                           ↓
If Approved → pending → preparing → ready → completed
If Rejected → rejected (with reason)
```

**Benefits**:
- Prevents fraudulent orders
- Staff can verify payment before preparation
- Allows staff to reject invalid/suspicious orders

### 5. Session Expiration
Sessions automatically expire after 60 minutes to prevent abuse.

**Expiration Check** (GuestOrder.jsx:50-64):
```javascript
useEffect(() => {
  const checkSession = () => {
    if (!sessionManager.isSessionValid()) {
      setIsSessionExpired(true);
      setCurrentStep('expired');
    } else {
      setTimeRemaining(sessionManager.getTimeRemaining());
    }
  };

  checkSession();
  const interval = setInterval(checkSession, 10000); // Check every 10 seconds
  return () => clearInterval(interval);
}, []);
```

**User Experience**:
- Warning banner when < 5 minutes remaining
- Error banner when expired
- "Nouvelle session" button to restart

### 6. Duplicate Order Prevention
Each session can only place one order.

**Implementation** (GuestOrder.jsx:66-73):
```javascript
useEffect(() => {
  const trackingUrl = sessionManager.getOrderPlacedUrl();
  if (trackingUrl) {
    console.log('⚠️ Order already placed, redirecting to tracking page');
    navigate(trackingUrl, { replace: true });
  }
}, [navigate]);
```

**Benefits**:
- Prevents accidental duplicate orders
- Ensures one order per QR code scan
- Improves user experience

### 7. Restaurant Control
Restaurants can disable guest ordering at any time.

**Check** (GuestOrder.jsx:128-132):
```javascript
if (!restaurantData.acceptingOrders) {
  setCurrentStep('closed');
  return;
}
```

**UI**: "🚫 Restaurant fermé - Le restaurant n'accepte pas de commandes pour le moment."

### 8. Order Notes Limit
Guest order notes limited to 50 characters to prevent abuse.

```javascript
<textarea
  value={orderNotes}
  onChange={(e) => setOrderNotes(e.target.value.slice(0, 50))}
  maxLength={50}
/>
```

### 9. Real-Time Firestore Security Rules

**Example Rule** (firestore.rules):
```javascript
match /orders/{orderId} {
  // Anyone can read guest orders with valid tracking secret
  allow read: if resource.data.isGuestOrder == true;

  // Only authenticated staff can create/update orders
  allow create, update: if request.auth != null &&
                           isAuthorizedForRestaurant(request.auth,
                                                     resource.data.restaurantId);
}
```

## Implementation Details

### Files Overview

| File | Purpose | Lines |
|------|---------|-------|
| `frontend/src/utils/sessionManager.js` | Session & cart management | 223 |
| `frontend/src/pages/GuestOrder.jsx` | Guest ordering flow | 584 |
| `frontend/src/pages/OrderTracking.jsx` | Real-time order tracking | 334 |
| `frontend/src/pages/QRCodeGenerator.jsx` | QR code generation tool | 303 |
| `frontend/src/utils/orderNumberGenerator.js` | Unique order number generator | 61 |

### Dependencies

**npm packages** (frontend/package.json):
```json
{
  "firebase": "^10.x",
  "qrcode": "^1.x",           // QR code generation
  "react": "^18.x",
  "react-router-dom": "^6.x"
}
```

### Key State Management

**GuestOrder.jsx State**:
```javascript
// Step management
const [currentStep, setCurrentStep] = useState('loading');
// Possible values: loading, info, menu, closed, error, expired

// Restaurant state
const [restaurant, setRestaurant] = useState(null);

// Guest info
const [guestName, setGuestName] = useState('');
const [guestPhone, setGuestPhone] = useState('');
const [orderType, setOrderType] = useState('dine-in');
const [tableNum, setTableNum] = useState('');

// Menu & cart
const [menuItems, setMenuItems] = useState([]);
const [cart, setCart] = useState([]);
const [orderNotes, setOrderNotes] = useState('');

// Session
const [timeRemaining, setTimeRemaining] = useState(null);
const [isSessionExpired, setIsSessionExpired] = useState(false);
```

**OrderTracking.jsx State**:
```javascript
const [order, setOrder] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [showThankYou, setShowThankYou] = useState(false);
const [countdown, setCountdown] = useState(5);
const hasShownThankYou = useRef(false); // Prevent showing modal twice
```

### Styling

**CSS Modules**:
- `GuestOrder.module.css` - Guest ordering page styles
- `OrderTracking.module.css` - Order tracking page styles
- `QRCodeGenerator.module.css` - QR generator page styles

**Key Animations**:
- Spinner for loading states
- Pulse animation for "Order Ready" badge
- Bounce animation for thank you icon
- Fade-in and slide-up for thank you modal

### Firestore Queries

**Find Restaurant by Short Code**:
```javascript
const restaurantsRef = collection(db, 'restaurants');
const q = query(
  restaurantsRef,
  where('shortCode', '==', restaurantCode.toUpperCase())
);
const querySnapshot = await getDocs(q);
```

**Load Menu Items**:
```javascript
// frontend/src/services/firestore.js
export const menuService = {
  async getAvailable(restaurantId) {
    const menuRef = collection(db, 'menu');
    const q = query(
      menuRef,
      where('restaurantId', '==', restaurantId),
      where('isAvailable', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
```

**Create Order**:
```javascript
const ordersRef = collection(db, 'orders');
const orderRef = await addDoc(ordersRef, orderData);
```

**Real-Time Order Listener**:
```javascript
const orderRef = doc(db, 'orders', orderId);
const unsubscribe = onSnapshot(orderRef, (snapshot) => {
  const orderData = { id: snapshot.id, ...snapshot.data() };
  setOrder(orderData);
});
```

## Common Scenarios

### Scenario 1: Dine-In Customer at Table 5

**Flow**:
1. Customer scans QR code on table 5
2. URL: `/guest/BURGER01/table/5`
3. Session created for BURGER01
4. Guest enters name: "John Doe"
5. Order type: "dine-in" (pre-filled)
6. Table number: "5" (pre-filled from URL)
7. Browse menu, add items to cart
8. Place order with note: "Extra ketchup"
9. Order created with status: `awaiting_approval`
10. Redirect to tracking page: `/track/order_abc/secret_xyz`
11. Staff sees order in Orders page
12. Staff approves order → status: `pending`
13. Kitchen updates to `preparing`
14. Kitchen marks as `ready`
15. Tracking page shows "✅ Votre commande est prête ! Table 5"
16. Staff delivers food, marks as `completed`
17. Thank you modal appears with 5-second countdown
18. Session cleared automatically

---

### Scenario 2: Takeout Customer

**Flow**:
1. Customer scans general QR code at entrance
2. URL: `/guest/BURGER01`
3. Session created
4. Guest enters name: "Jane Smith", phone: "+212 6XX"
5. Order type: "takeout"
6. No table number required
7. Browse menu, add 2 burgers and 1 fries
8. Place order
9. Order created with `orderType: "takeout"`
10. Tracking page shows "📦 À emporter"
11. Staff approves order
12. Kitchen prepares
13. Order ready → "Veuillez récupérer votre commande au comptoir"
14. Customer picks up order
15. Staff marks as completed
16. Thank you modal + session cleanup

---

### Scenario 3: Session Expiration During Ordering

**Flow**:
1. Customer scans QR code
2. Session created (60 min timer starts)
3. Customer browses menu for 55 minutes
4. **Warning banner**: "⚠️ Votre session expire bientôt (5m)"
5. Customer adds items to cart
6. Customer tries to place order after 61 minutes
7. **Error**: "Votre session a expiré."
8. Redirect to expired page
9. "⏰ Session expirée - Veuillez scanner le code QR à nouveau"
10. Customer clicks "Nouvelle session" → page reloads
11. New session created, can start ordering again

---

### Scenario 4: Restaurant Closed

**Flow**:
1. Customer scans QR code
2. Session initialization
3. Restaurant query successful
4. **Check**: `restaurant.acceptingOrders === false`
5. Show closed page: "🚫 Restaurant fermé"
6. "Le restaurant n'accepte pas de commandes pour le moment."
7. No ordering allowed

---

### Scenario 5: Order Rejection

**Flow**:
1. Guest places order
2. Order created with status: `awaiting_approval`
3. Staff reviews order
4. Staff clicks "Reject" and enters reason: "Invalid payment method"
5. Order updated:
   - `status: "rejected"`
   - `rejectionReason: "Invalid payment method"`
6. Tracking page updates immediately (real-time listener)
7. Red rejection box appears:
   - "❌ Commande rejetée"
   - "Invalid payment method"
8. Guest sees rejection reason

---

### Scenario 6: Duplicate Order Prevention

**Flow**:
1. Guest places order successfully
2. Tracking URL stored: `sessionManager.setOrderPlaced('/track/...')`
3. Guest presses back button (accidentally)
4. Returns to cart page
5. Guest clicks "Passer la commande" again
6. **Check**: `sessionManager.getOrderPlacedUrl()` returns URL
7. Redirect to existing tracking page (no duplicate order created)

---

### Scenario 7: Invalid Tracking Link

**Flow**:
1. Someone tries to guess tracking URL
2. Access: `/track/order_123/wrong_secret`
3. Order exists but `trackingSecret` doesn't match
4. **Error**: "❌ Lien de suivi invalide"
5. "Veuillez vérifier votre lien de suivi"
6. Order details NOT shown (security validated)

---

## Best Practices

### For Restaurant Owners

1. **Print QR Codes Clearly**
   - Use high-quality printing
   - Large enough to scan easily (at least 5cm x 5cm)
   - Protected from spills/damage (laminated recommended)

2. **Place QR Codes Strategically**
   - **Dine-in**: On each table (table-specific QR codes)
   - **Takeout**: Near entrance, on menus, on window
   - **Pickup**: On counter, on receipts

3. **Train Staff on Approval Workflow**
   - Check guest orders regularly
   - Approve valid orders quickly
   - Reject with clear reasons if needed
   - Update order status promptly

4. **Control Order Acceptance**
   - Toggle "Accepter les commandes" when kitchen is closed
   - Disable during rush hours if needed
   - Re-enable when ready to accept orders

5. **Monitor Session Limits**
   - 60-minute sessions are usually sufficient
   - Consider shorter sessions for very busy periods

### For Developers

1. **Session Management**
   - Always check `isSessionValid()` before critical operations
   - Clear sessions after order completion
   - Handle session expiration gracefully

2. **Error Handling**
   - Show user-friendly error messages
   - Log errors to console for debugging
   - Provide fallback options (e.g., "Nouvelle session" button)

3. **Real-Time Listeners**
   - Always unsubscribe in cleanup function
   - Handle snapshot errors
   - Update UI immediately on data changes

4. **Security**
   - Never expose tracking secrets in logs
   - Validate all inputs (name, phone, notes)
   - Enforce character limits on text fields

5. **Performance**
   - Load only available menu items
   - Use indexes for Firestore queries
   - Lazy load images if menu has pictures

6. **Testing**
   - Test session expiration scenarios
   - Test duplicate order prevention
   - Test real-time updates with multiple devices
   - Test QR code generation and scanning

---

## Troubleshooting

### Issue: Session Expires Too Quickly

**Symptom**: Guests complain they don't have enough time to order.

**Solution**:
```javascript
// frontend/src/utils/sessionManager.js:6
const SESSION_DURATION = 90 * 60 * 1000; // Change to 90 minutes
```

---

### Issue: QR Code Doesn't Scan

**Symptom**: Camera can't read QR code.

**Possible Causes**:
1. QR code printed too small → Print at least 5cm x 5cm
2. Poor print quality → Use high-resolution image (400x400 default)
3. Damaged/dirty QR code → Reprint and laminate

---

### Issue: "Restaurant non trouvé" Error

**Symptom**: Valid QR code shows restaurant not found.

**Possible Causes**:
1. Restaurant `shortCode` doesn't match URL
2. Restaurant document deleted from Firestore
3. Typo in QR code URL

**Solution**:
- Verify restaurant exists in Firestore
- Check `shortCode` field matches exactly (case-sensitive)
- Regenerate QR code if URL is wrong

---

### Issue: Duplicate Orders Created

**Symptom**: Same guest creates multiple orders in one session.

**Check**:
1. Is `sessionManager.setOrderPlaced()` being called after order creation?
2. Is `sessionManager.getOrderPlacedUrl()` being checked before placing order?

**Solution**: Ensure both functions are implemented correctly in GuestOrder.jsx.

---

### Issue: Order Tracking Not Updating

**Symptom**: Order status changes but tracking page doesn't update.

**Possible Causes**:
1. Firestore listener not attached
2. Component unmounted (user navigated away)
3. Firestore security rules blocking read

**Debug**:
```javascript
// Add logging to onSnapshot callback
onSnapshot(orderRef, (snapshot) => {
  console.log('Order updated:', snapshot.data());
  // ...
});
```

---

## Future Enhancements

### Potential Features

1. **Push Notifications**
   - Send browser notifications when order status changes
   - Requires service worker + FCM web tokens

2. **Order Customization**
   - Allow item customization (e.g., "No pickles", "Extra cheese")
   - Modifier options in menu items

3. **Payment Integration**
   - Accept online payments (Stripe, PayPal)
   - Update `paymentStatus` to 'paid' automatically

4. **Multi-Language Support**
   - i18n for Arabic, English, French
   - Language selector in UI

5. **Order History**
   - Show past orders for returning guests (optional login)
   - Cookie-based or phone number lookup

6. **Estimated Wait Time**
   - Display "~15 minutes" based on kitchen load
   - Real-time updates

7. **Feedback & Ratings**
   - Allow guests to rate their experience after completion
   - Collect feedback for analytics

8. **SMS Notifications**
   - Send SMS when order is ready (if phone provided)
   - Integration with Twilio or similar service

---

## Conclusion

The Guest Self-Service System provides a seamless, no-app-required ordering experience for customers. By leveraging QR codes, localStorage sessions, and real-time Firestore updates, guests can order food and track their orders without creating an account.

**Key Advantages**:
- ✅ No authentication required
- ✅ Works on any device with a camera
- ✅ Real-time order tracking
- ✅ Staff approval workflow for security
- ✅ Automatic session cleanup
- ✅ Duplicate order prevention
- ✅ Mobile-friendly responsive design

**For More Information**:
- [Database Schema](./DATABASE_SCHEMA.md) - Orders collection structure
- [Authentication Guide](./AUTHENTICATION_GUIDE.md) - Staff authentication vs guest access
- [Technical Overview](./TECHNICAL_OVERVIEW.md) - System architecture
- [Frontend Guide](./FRONTEND_GUIDE.md) - React components and patterns
