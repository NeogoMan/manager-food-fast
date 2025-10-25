# 🔥 Firebase Migration - Quick Reference

## ⚡ Key Commands

```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only hosting

# View logs
firebase functions:log

# List deployed functions
firebase functions:list

# Check usage
firebase use
```

---

## 📦 Service Imports

```javascript
// Firestore services
import { menuService, ordersService, usersService, dashboardService } from '../services/firestore';

// Cloud Functions
import { userFunctions } from '../services/cloudFunctions';

// Firebase SDK
import { auth, db, functions } from '../config/firebase';

// Auth context
import { useAuth } from '../contexts/AuthContext';
```

---

## 🔐 Authentication

```javascript
// Login (already migrated in AuthContext)
const { login, logout, user, hasRole } = useAuth();

await login(username, password);

// Check roles
if (hasRole('manager', 'cashier')) {
  // Allow action
}

// Get ID token (if needed)
const { getIdToken } = useAuth();
const token = await getIdToken();
```

---

## 📝 Menu Operations

```javascript
// Get all
const items = await menuService.getAll();

// Get available only
const items = await menuService.getAvailable();

// Create
await menuService.create({
  name: 'Burger',
  price: 45.00,
  category: 'burgers',
  isAvailable: true,
});

// Update
await menuService.update(itemId, { price: 50.00 });

// Delete
await menuService.delete(itemId);

// Real-time subscription
useEffect(() => {
  const unsubscribe = menuService.subscribe((items) => {
    setMenuItems(items);
  });
  return () => unsubscribe();
}, []);
```

---

## 📦 Order Operations

```javascript
// Get all orders
const orders = await ordersService.getAll();

// Get by status
const pending = await ordersService.getByStatus('pending');

// Get user's orders
const myOrders = await ordersService.getByUserId(userId);

// Create order
await ordersService.create({
  userId: user.id,
  clientName: user.name,
  totalAmount: 150.00,
  notes: 'No onions',
  items: [
    {
      menuItemId: 'item123',
      name: 'Burger',
      quantity: 2,
      unitPrice: 45.00,
      subtotal: 90.00,
    }
  ],
});

// Update status
await ordersService.updateStatus(orderId, 'preparing');

// Real-time subscription
useEffect(() => {
  const unsubscribe = ordersService.subscribe((orders) => {
    setOrders(orders);
  });
  return () => unsubscribe();
}, []);

// Kitchen subscription (pending + preparing only)
useEffect(() => {
  const unsubscribe = ordersService.subscribeToKitchen((orders) => {
    setKitchenOrders(orders);
  });
  return () => unsubscribe();
}, []);
```

---

## 👥 User Management

```javascript
// Get all users
const users = await usersService.getAll();

// Create user (Cloud Function - manager only)
await userFunctions.create({
  username: 'john_doe',
  password: 'SecurePass123',
  role: 'cashier',
  name: 'John Doe',
  phone: '+212600000000',
});

// Update role (Cloud Function - manager only)
await userFunctions.setRole(userId, 'manager');

// Update status (Cloud Function - manager only)
await userFunctions.updateStatus(userId, 'inactive');

// Update user info (Firestore)
await usersService.update(userId, {
  name: 'New Name',
  phone: '+212600000000',
});
```

---

## 📊 Dashboard

```javascript
// Get today's stats
const stats = await dashboardService.getTodayStats();
// Returns: { totalOrders, completedOrders, pendingOrders, totalRevenue, averageOrderValue }

// Get stats for date range
const stats = await dashboardService.getStatsForRange(startDate, endDate);
```

---

## 🔔 Notifications

```javascript
// Get user notifications
const notifications = await notificationsService.getByUserId(userId);

// Mark as read
await notificationsService.markAsRead(notificationId);

// Real-time subscription
useEffect(() => {
  const unsubscribe = notificationsService.subscribe(userId, (notifications) => {
    setNotifications(notifications);
  });
  return () => unsubscribe();
}, [userId]);
```

---

## ⚠️ Error Handling

```javascript
try {
  await menuService.create(newItem);
} catch (error) {
  if (error.code === 'permission-denied') {
    alert('You do not have permission');
  } else if (error.code === 'functions/not-found') {
    alert('Invalid credentials');
  } else {
    console.error('Error:', error);
    alert('An error occurred');
  }
}
```

---

## 🔄 Real-Time Pattern

```javascript
const Component = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = service.subscribe((newData) => {
      setData(newData);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, []);

  return <div>{/* Render data */}</div>;
};
```

---

## 🎨 Status Values

```javascript
// Order statuses
'awaiting_approval' // Manager needs to approve
'pending'           // Approved, waiting for kitchen
'preparing'         // Kitchen is preparing
'ready'             // Ready for pickup
'completed'         // Order completed

// User roles
'manager'   // Full access
'cashier'   // Manage orders
'cook'      // View/update kitchen orders
'client'    // View own orders

// User status
'active'    // Can login
'inactive'  // Cannot login
```

---

## 📁 File Structure

```
src/
├── config/
│   └── firebase.js          # Firebase SDK config
├── services/
│   ├── firestore.js         # Firestore operations
│   └── cloudFunctions.js    # Cloud Functions calls
├── contexts/
│   └── AuthContext.jsx      # Auth with Firebase
└── pages/
    ├── Menu.jsx             # Update to use menuService
    ├── Orders.jsx           # Update to use ordersService
    ├── Kitchen.jsx          # Update to use ordersService.subscribeToKitchen()
    ├── Users.jsx            # Update to use usersService + userFunctions
    └── Dashboard.jsx        # Update to use dashboardService
```

---

## 🚀 Deployment Checklist

- [ ] `cd functions && npm install`
- [ ] `firebase deploy --only firestore:rules`
- [ ] `firebase deploy --only functions`
- [ ] Create admin user in Firestore
- [ ] Test login
- [ ] Update frontend components
- [ ] Test all features
- [ ] `firebase deploy --only hosting`

---

## 💰 Cost Monitoring

Check usage:
- Firebase Console → Usage and billing

Set alerts:
- Budget: $5/month
- Email notification

Expected: **$0-1/month** ✅

---

## 📚 Documentation

- `README_FIREBASE_MIGRATION.md` - Quick start
- `DEPLOYMENT_INSTRUCTIONS.md` - Step-by-step deployment
- `FRONTEND_MIGRATION_GUIDE.md` - Component migration patterns
- `FIREBASE_SETUP.md` - Detailed setup guide

---

## 🆘 Troubleshooting

**Login not working?**
```bash
firebase functions:log
```

**Permission denied?**
```bash
firebase deploy --only firestore:rules
```

**Functions not deploying?**
```bash
firebase deploy --only functions --force
```

---

**Need help? Check the documentation files or ask!** 🚀
