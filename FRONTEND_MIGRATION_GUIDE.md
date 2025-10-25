# Frontend Migration Guide

## Services Created

I've created two new service files to replace the API:

### 1. `frontend/src/services/firestore.js`
Direct Firestore operations for:
- **menuService** - Menu CRUD operations
- **ordersService** - Order management with real-time subscriptions
- **usersService** - User management
- **notificationsService** - Notifications
- **dashboardService** - Stats and analytics

### 2. `frontend/src/services/cloudFunctions.js`
Cloud Functions for operations that need server-side logic:
- **userFunctions.create()** - Create new user (manager only)
- **userFunctions.setRole()** - Update user role (manager only)
- **userFunctions.updateStatus()** - Activate/deactivate user (manager only)

---

## Migration Patterns

### Before (API calls)
```javascript
import { api } from '../utils/api';

// Get menu items
const response = await fetch('/api/menu');
const items = await response.json();

// Create order
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
```

### After (Firestore)
```javascript
import { menuService, ordersService } from '../services/firestore';

// Get menu items
const items = await menuService.getAll();

// Create order
const order = await ordersService.create(orderData);
```

---

## Real-Time Updates

### Before (Socket.io)
```javascript
import { socket } from '../utils/socketService';

useEffect(() => {
  socket.on('new-order', (order) => {
    setOrders(prev => [...prev, order]);
  });

  return () => socket.off('new-order');
}, []);
```

### After (Firestore listeners)
```javascript
import { ordersService } from '../services/firestore';

useEffect(() => {
  // Subscribe to real-time updates
  const unsubscribe = ordersService.subscribe((orders) => {
    setOrders(orders);
  });

  // Cleanup on unmount
  return () => unsubscribe();
}, []);
```

---

## Component Migration Examples

### Menu Component

**Before:**
```javascript
import { api } from '../utils/api';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu');
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  const handleAdd = async (item) => {
    await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    fetchMenu();
  };

  // ...
};
```

**After:**
```javascript
import { menuService } from '../services/firestore';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    // Option 1: Fetch once
    fetchMenu();

    // Option 2: Real-time updates (recommended)
    const unsubscribe = menuService.subscribe((items) => {
      setMenuItems(items);
    });

    return () => unsubscribe();
  }, []);

  const fetchMenu = async () => {
    try {
      const items = await menuService.getAll();
      setMenuItems(items);
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  const handleAdd = async (item) => {
    try {
      await menuService.create(item);
      // No need to refetch - real-time listener will update automatically
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  };

  // ...
};
```

### Orders Component (with Real-Time)

**Before:**
```javascript
import { socket } from '../utils/socketService';

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();

    socket.on('order-updated', handleOrderUpdate);
    socket.on('new-order', handleNewOrder);

    return () => {
      socket.off('order-updated');
      socket.off('new-order');
    };
  }, []);

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(prev =>
      prev.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    );
  };

  // ...
};
```

**After:**
```javascript
import { ordersService } from '../services/firestore';

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = ordersService.subscribe((orders) => {
      setOrders(orders);
      // Automatically handles new, updated, and deleted orders!
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await ordersService.updateStatus(orderId, newStatus);
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  // ...
};
```

### Kitchen Screen (Real-Time)

**After:**
```javascript
import { ordersService } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';

const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const { hasRole } = useAuth();

  useEffect(() => {
    // Only cooks and managers can access
    if (!hasRole('cook', 'manager')) return;

    // Subscribe to kitchen orders (pending + preparing only)
    const unsubscribe = ordersService.subscribeToKitchen((kitchenOrders) => {
      setOrders(kitchenOrders);

      // Play sound for new orders
      const newOrders = kitchenOrders.filter(o => o.status === 'pending');
      if (newOrders.length > 0) {
        playNotificationSound();
      }
    });

    return () => unsubscribe();
  }, [hasRole]);

  // ...
};
```

### User Management (Cloud Functions)

**Before:**
```javascript
const handleCreateUser = async (userData) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
};
```

**After:**
```javascript
import { userFunctions } from '../services/cloudFunctions';

const handleCreateUser = async (userData) => {
  try {
    const result = await userFunctions.create({
      username: userData.username,
      password: userData.password,
      role: userData.role,
      name: userData.name,
      phone: userData.phone,
    });

    console.log('User created:', result.userId);
  } catch (error) {
    console.error('Error creating user:', error);
    alert(error.message);
  }
};
```

---

## Components to Update

### Priority 1 (Critical)
- [x] `contexts/AuthContext.jsx` - ✅ Already migrated
- [ ] `pages/Menu.jsx` - Menu management
- [ ] `pages/Orders.jsx` - Order management
- [ ] `pages/Kitchen.jsx` - Kitchen screen
- [ ] `pages/Users.jsx` - User management

### Priority 2 (Important)
- [ ] `pages/CustomerMenu.jsx` - Customer menu view
- [ ] `pages/Cart.jsx` - Shopping cart
- [ ] `pages/MyOrders.jsx` - Client order history
- [ ] `pages/Dashboard.jsx` - Stats dashboard

### Priority 3 (Nice to have)
- [ ] `components/ConnectionStatus.jsx` - Remove Socket.io status
- [ ] `utils/socketService.js` - Can be removed
- [ ] `contexts/SocketContext.jsx` - Can be removed

---

## Common Patterns

### 1. Fetching Data
```javascript
// One-time fetch
const items = await menuService.getAll();

// With filters
const available = await menuService.getAvailable();
const byCategory = await menuService.getByCategory('burgers');
```

### 2. Real-Time Subscriptions
```javascript
useEffect(() => {
  const unsubscribe = menuService.subscribe((items) => {
    setMenuItems(items);
  });

  // IMPORTANT: Always cleanup
  return () => unsubscribe();
}, []);
```

### 3. Creating Documents
```javascript
const newItem = await menuService.create({
  name: 'Burger',
  price: 45.00,
  category: 'burgers',
  isAvailable: true,
});
```

### 4. Updating Documents
```javascript
await menuService.update(itemId, {
  price: 50.00,
  isAvailable: false,
});
```

### 5. Deleting Documents
```javascript
await menuService.delete(itemId);
```

### 6. Handling Errors
```javascript
try {
  await menuService.create(newItem);
} catch (error) {
  if (error.code === 'permission-denied') {
    alert('You do not have permission to perform this action');
  } else {
    console.error('Error:', error);
    alert('An error occurred');
  }
}
```

---

## Firestore Security Rules

The security rules ensure:
- **Managers** can read/write everything
- **Cashiers** can read/write orders
- **Cooks** can read orders and update status
- **Clients** can only read their own orders
- **Everyone** can read the menu (public)

Rules are enforced server-side, so you don't need to check permissions in frontend for security (only for UX).

---

## Real-Time Benefits

### Before (Socket.io)
- Complex setup
- Manual event handling
- Requires WebSocket server
- Connection management
- Room management

### After (Firestore)
- Simple `onSnapshot()`
- Automatic updates
- No server needed
- Auto reconnection
- Built-in offline support

---

## Testing Checklist

### Menu Management
- [ ] View all menu items
- [ ] Create new menu item
- [ ] Update menu item (price, availability)
- [ ] Delete menu item
- [ ] Real-time updates when other user modifies

### Orders
- [ ] View all orders
- [ ] Create new order
- [ ] Update order status
- [ ] Real-time updates in kitchen
- [ ] Approve/reject orders (manager)

### User Management
- [ ] View all users
- [ ] Create new user (Cloud Function)
- [ ] Update user role (Cloud Function)
- [ ] Deactivate user (Cloud Function)

### Dashboard
- [ ] View today's stats
- [ ] View order history
- [ ] Stats update in real-time

---

## Next Steps

1. **Deploy Cloud Functions** (if not done yet):
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

2. **Start Migrating Components**:
   - Begin with `pages/Menu.jsx`
   - Then `pages/Orders.jsx`
   - Then `pages/Kitchen.jsx`

3. **Test Each Component** after migration

4. **Remove Old Code**:
   - `utils/socketService.js`
   - `contexts/SocketContext.jsx`
   - `utils/api.js` (keep for reference initially)

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Firestore security rules are deployed
3. Check Cloud Functions are deployed
4. Verify user has correct role in Firebase Auth custom claims
5. Ask me for help!

---

**Ready to start migrating components!** 🚀
