/**
 * Firestore Service
 * Replaces the API utility with direct Firestore operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Menu Items Service
 */
export const menuService = {
  // Get all menu items
  async getAll() {
    const querySnapshot = await getDocs(collection(db, 'menu'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  },

  // Get menu items by category
  async getByCategory(category) {
    const q = query(collection(db, 'menu'), where('category', '==', category));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  },

  // Get available menu items
  async getAvailable() {
    const q = query(collection(db, 'menu'), where('isAvailable', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  },

  // Get single menu item
  async getById(id) {
    const docRef = doc(db, 'menu', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error('Menu item not found');
  },

  // Create menu item
  async create(menuItem, restaurantId) {
    const docRef = await addDoc(collection(db, 'menu'), {
      ...menuItem,
      restaurantId, // IMPORTANT: Required for multi-tenant security rules
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { id: docRef.id, ...menuItem, restaurantId };
  },

  // Update menu item
  async update(id, updates) {
    const docRef = doc(db, 'menu', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { id, ...updates };
  },

  // Delete menu item
  async delete(id) {
    const docRef = doc(db, 'menu', id);
    await deleteDoc(docRef);
    return { success: true };
  },

  // Subscribe to menu changes (real-time)
  subscribe(callback) {
    const unsubscribe = onSnapshot(collection(db, 'menu'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(items);
    });
    return unsubscribe;
  },
};

/**
 * Orders Service
 */
export const ordersService = {
  // Get all orders
  async getAll() {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));
  },

  // Get orders by status
  async getByStatus(status) {
    const q = query(
      collection(db, 'orders'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));
  },

  // Get orders by user
  async getByUserId(userId) {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));
  },

  // Get single order
  async getById(id) {
    const docRef = doc(db, 'orders', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    }
    throw new Error('Order not found');
  },

  // Create order
  async create(orderData, restaurantId) {
    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Use the status from orderData, or default to 'awaiting_approval'
    const status = orderData.status || 'awaiting_approval';

    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      orderNumber,
      status,
      restaurantId, // IMPORTANT: Required for multi-tenant security rules
      // Initialize payment status as unpaid
      paymentStatus: 'unpaid',
      paymentAmount: null,
      changeGiven: null,
      paymentTime: null,
      paymentMethod: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return {
      id: docRef.id,
      orderNumber,
      ...orderData,
      restaurantId,
      status,
      paymentStatus: 'unpaid',
    };
  },

  // Update order
  async update(id, updates) {
    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { id, ...updates };
  },

  // Update order status
  async updateStatus(id, status, additionalData = {}) {
    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, {
      status,
      ...additionalData,
      updatedAt: Timestamp.now(),
    });
    return { id, status };
  },

  // Delete order
  async delete(id) {
    const docRef = doc(db, 'orders', id);
    await deleteDoc(docRef);
    return { success: true };
  },

  // Subscribe to orders (real-time)
  subscribe(callback, filterOptions = {}) {
    let q = collection(db, 'orders');

    // Apply filters if provided
    const constraints = [];

    // IMPORTANT: Always filter by restaurantId for multi-tenant isolation
    if (filterOptions.restaurantId) {
      constraints.push(where('restaurantId', '==', filterOptions.restaurantId));
    }

    if (filterOptions.status) {
      if (Array.isArray(filterOptions.status)) {
        constraints.push(where('status', 'in', filterOptions.status));
      } else {
        constraints.push(where('status', '==', filterOptions.status));
      }
    }

    if (filterOptions.userId) {
      constraints.push(where('userId', '==', filterOptions.userId));
    }

    // TEMPORARY WORKAROUND: Remove orderBy to avoid composite index requirement
    // Sort on client-side instead (see below)
    // constraints.push(orderBy('createdAt', 'asc'));

    q = query(q, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));

        // Client-side sorting by createdAt ascending (oldest first)
        orders = orders.sort((a, b) => {
          const aTime = a.createdAt?.getTime() || 0;
          const bTime = b.createdAt?.getTime() || 0;
          return aTime - bTime;
        });

        callback(orders);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
      }
    );

    return unsubscribe;
  },

  // Subscribe to kitchen orders (pending + preparing + ready)
  subscribeToKitchen(callback) {
    return this.subscribe(callback, {
      status: ['pending', 'preparing', 'ready'],
    });
  },

  // Get pending approval orders
  async getPendingApproval() {
    return this.getByStatus('awaiting_approval');
  },

  // Approve order (change status to pending)
  async approve(id) {
    return this.updateStatus(id, 'pending');
  },

  // Reject order (change status to rejected)
  async reject(id, reason = null) {
    const updates = { status: 'rejected' };
    if (reason) {
      updates.rejectionReason = reason;
    }
    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { id, ...updates };
  },

  // Record payment for an order
  async recordPayment(id, paymentData) {
    const docRef = doc(db, 'orders', id);
    const updates = {
      paymentStatus: 'paid',
      paymentAmount: paymentData.amount,
      changeGiven: paymentData.change,
      paymentTime: Timestamp.now(),
      paymentMethod: paymentData.method || 'cash',
      updatedAt: Timestamp.now(),
    };

    await updateDoc(docRef, updates);

    return {
      id,
      ...updates,
      paymentTime: updates.paymentTime.toDate(),
    };
  },
};

/**
 * Users Service
 */
export const usersService = {
  // Get all users
  async getAll(restaurantId = null) {
    let q = collection(db, 'users');

    // IMPORTANT: Filter by restaurantId for multi-tenant isolation
    if (restaurantId) {
      q = query(q, where('restaurantId', '==', restaurantId));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Don't return password hash to frontend
      passwordHash: undefined,
    }));
  },

  // Get users by role
  async getByRole(role) {
    const q = query(collection(db, 'users'), where('role', '==', role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      passwordHash: undefined,
    }));
  },

  // Get single user
  async getById(id) {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        passwordHash: undefined,
      };
    }
    throw new Error('User not found');
  },

  // Update user
  async update(id, updates) {
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { id, ...updates };
  },

  // Subscribe to users (real-time)
  subscribe(callback, restaurantId = null) {
    let q = collection(db, 'users');

    // Filter by restaurantId if provided (multi-tenant)
    if (restaurantId) {
      q = query(q, where('restaurantId', '==', restaurantId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        passwordHash: undefined,
      }));
      callback(users);
    });
    return unsubscribe;
  },
};

/**
 * Notifications Service
 */
export const notificationsService = {
  // Get user notifications
  async getByUserId(userId) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }));
  },

  // Mark notification as read
  async markAsRead(id) {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, { read: true });
  },

  // Subscribe to user notifications (real-time)
  subscribe(userId, callback) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      callback(notifications);
    });

    return unsubscribe;
  },
};

/**
 * Dashboard/Stats Service
 */
export const dashboardService = {
  // Get today's stats
  async getTodayStats(restaurantId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const constraints = [
      where('createdAt', '>=', Timestamp.fromDate(today))
    ];

    // IMPORTANT: Filter by restaurantId for multi-tenant isolation
    if (restaurantId) {
      constraints.push(where('restaurantId', '==', restaurantId));
    }

    const q = query(collection(db, 'orders'), ...constraints);

    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => doc.data());

    // Calculate stats
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      totalOrders,
      completedOrders,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      totalRevenue,
      averageOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0,
    };
  },

  // Get stats for date range
  async getStatsForRange(startDate, endDate, restaurantId) {
    const constraints = [
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate))
    ];

    // IMPORTANT: Filter by restaurantId for multi-tenant isolation
    if (restaurantId) {
      constraints.push(where('restaurantId', '==', restaurantId));
    }

    const q = query(collection(db, 'orders'), ...constraints);

    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => doc.data());

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      totalOrders,
      completedOrders,
      totalRevenue,
      averageOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0,
    };
  },

  // Get filter options (users by role)
  async getFilterOptions(restaurantId) {
    try {
      let q = collection(db, 'users');

      // IMPORTANT: Filter by restaurantId for multi-tenant isolation
      if (restaurantId) {
        q = query(q, where('restaurantId', '==', restaurantId));
      }

      const usersSnapshot = await getDocs(q);
      const users = usersSnapshot.docs.map(doc => doc.data());

      const caissiers = users
        .filter(u => u.role === 'cashier')
        .map(u => u.name || u.username);

      const cuisiniers = users
        .filter(u => u.role === 'cook')
        .map(u => u.name || u.username);

      return {
        caissiers,
        cuisiniers,
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return { caissiers: [], cuisiniers: [] };
    }
  },

  // Get comprehensive statistics with filters
  async getStatistics(params = {}) {
    const { start_date, end_date, status: statusFilter, restaurantId } = params;

    // Build query constraints
    const constraints = [];

    // IMPORTANT: Filter by restaurantId for multi-tenant isolation (first constraint)
    if (restaurantId) {
      constraints.push(where('restaurantId', '==', restaurantId));
    }

    if (start_date) {
      const startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(startDate)));
    }

    if (end_date) {
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(endDate)));
    }

    // Add orderBy last
    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collection(db, 'orders'), ...constraints);
    const querySnapshot = await getDocs(q);

    let orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }));

    // Apply additional filters in memory (since Firestore has limitations on compound queries)
    if (statusFilter && statusFilter !== 'all') {
      orders = orders.filter(o => o.status === statusFilter);
    }

    // Calculate summary statistics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    const completedPercentage = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    // Calculate top products
    const productStats = {};
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const key = item.name || item.menuItemId;
          if (!productStats[key]) {
            productStats[key] = {
              product_name: item.name || 'Unknown',
              total_quantity: 0,
              total_revenue: 0,
            };
          }
          productStats[key].total_quantity += item.quantity || 0;
          productStats[key].total_revenue += (item.price || 0) * (item.quantity || 0);
        });
      }
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10)
      .map(p => ({
        ...p,
        percentage: totalRevenue > 0 ? Math.round((p.total_revenue / totalRevenue) * 100) : 0,
      }));

    // Calculate orders by status
    const statusCounts = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0,
    }));

    // Get recent orders (last 10)
    const recentOrders = orders.slice(0, 10).map(order => ({
      order_id: order.orderNumber || order.id,
      created_at: order.createdAt,
      client_name: order.customerName || 'Walk-in',
      status: order.status,
      total_amount: order.totalAmount || 0,
    }));

    return {
      summary: {
        total_orders: totalOrders,
        completed_orders: completedOrders,
        total_revenue: totalRevenue,
        average_order_value: averageOrderValue,
        completed_percentage: completedPercentage,
      },
      top_products: topProducts,
      orders_by_status: ordersByStatus,
      orders_by_caissier: [], // Not tracked in current Firestore schema
      recent_orders: recentOrders,
    };
  },
};

export default {
  menu: menuService,
  orders: ordersService,
  users: usersService,
  notifications: notificationsService,
  dashboard: dashboardService,
};
