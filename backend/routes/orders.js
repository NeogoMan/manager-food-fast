import express from 'express';
import {
  emitNewOrder,
  emitOrderStatusUpdate,
  emitOrderApprovalRequest,
  emitOrderAccepted,
  emitOrderRejected
} from '../utils/socketManager.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { query, getClient } from '../database/postgres.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Valid order statuses
const VALID_STATUSES = [
  'awaiting_approval',  // En attente d'approbation (NEW)
  'rejected',           // Refusé (NEW)
  'pending',            // En attente
  'preparing',          // En préparation
  'ready',              // Prêt
  'completed',          // Terminé
  'cancelled'           // Annulé
];

/**
 * Generate unique order ID (format: ko-xxxxxxxx)
 */
function generateOrderId() {
  // Generate 8-digit random number
  const randomNum = Math.floor(10000000 + Math.random() * 90000000);
  return `ko-${randomNum}`;
}

/**
 * GET /api/orders
 * Get all orders or filter by status
 * Clients can only see their own orders
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit } = req.query;
    let queryText = `
      SELECT o.*
      FROM orders o
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter by user_id for clients
    if (req.user.role === 'client') {
      queryText += ` AND o.user_id = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    queryText += ' ORDER BY o.created_at DESC';

    if (limit) {
      queryText += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
    }

    const result = await query(queryText, params);
    const orders = result.rows;

    // Fetch items for each order (same pattern as pending-approval endpoint)
    const ordersWithItems = await Promise.all(orders.map(async order => {
      const itemsResult = await query(`
        SELECT
          oi.*,
          mi.name as menu_item_name,
          mi.category
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = $1
      `, [order.id]);

      return { ...order, items: itemsResult.rows };
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/orders/pending-approval
 * Get all orders awaiting approval (Gestionnaire/Caissier only)
 * IMPORTANT: This must come BEFORE /:id route
 */
router.get('/pending-approval', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const result = await query(`
      SELECT
        o.*,
        u.name as client_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.status = 'awaiting_approval'
      ORDER BY o.created_at DESC
    `);

    const orders = result.rows;

    // Get items for each order
    const ordersWithItems = await Promise.all(orders.map(async order => {
      const itemsResult = await query(`
        SELECT
          oi.*,
          mi.name as menu_item_name,
          mi.category
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = $1
      `, [order.id]);

      return { ...order, items: itemsResult.rows };
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
});

/**
 * POST /api/orders/:id/approve
 * Approve an order (Gestionnaire/Caissier only)
 * IMPORTANT: This must come BEFORE generic /:id routes
 */
router.post('/:id/approve', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if order exists
    const existingResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    const existing = existingResult.rows[0];

    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (existing.status !== 'awaiting_approval') {
      return res.status(400).json({ error: 'Order is not awaiting approval' });
    }

    // Update order status to pending and set approval fields
    await query(`
      UPDATE orders
      SET status = 'pending',
          approved_by = $1,
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [req.user.id, id]);

    const updatedResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    const updatedOrder = updatedResult.rows[0];

    const itemsResult = await query(`
      SELECT
        oi.*,
        mi.name as menu_item_name,
        mi.category
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
    `, [id]);

    const fullOrder = { ...updatedOrder, items: itemsResult.rows };

    // Emit WebSocket event for order acceptance
    emitOrderAccepted(fullOrder);

    res.json({ success: true, message: 'Order approved successfully', order: fullOrder });
  } catch (error) {
    console.error('Error approving order:', error);
    res.status(500).json({ error: 'Failed to approve order' });
  }
});

/**
 * POST /api/orders/:id/reject
 * Reject an order (Gestionnaire/Caissier only)
 * IMPORTANT: This must come BEFORE generic /:id routes
 */
router.post('/:id/reject', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if order exists
    const existingResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    const existing = existingResult.rows[0];

    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (existing.status !== 'awaiting_approval') {
      return res.status(400).json({ error: 'Order is not awaiting approval' });
    }

    // Update order status to rejected
    await query(`
      UPDATE orders
      SET status = 'rejected',
          approved_by = $1,
          approved_at = CURRENT_TIMESTAMP,
          rejection_reason = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [req.user.id, reason || null, id]);

    const updatedResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    const updatedOrder = updatedResult.rows[0];

    const itemsResult = await query(`
      SELECT
        oi.*,
        mi.name as menu_item_name,
        mi.category
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
    `, [id]);

    const fullOrder = { ...updatedOrder, items: itemsResult.rows };

    // Emit WebSocket event for order rejection
    emitOrderRejected(fullOrder);

    res.json({ success: true, message: 'Order rejected successfully', order: fullOrder });
  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({ error: 'Failed to reject order' });
  }
});

/**
 * GET /api/orders/:id
 * Get a single order with all items
 * Clients can only see their own orders
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get order details
    let queryText = 'SELECT * FROM orders WHERE id = $1';
    const params = [id];

    // Filter by user_id for clients
    if (req.user.role === 'client') {
      queryText += ' AND user_id = $2';
      params.push(req.user.id);
    }

    const result = await query(queryText, params);
    const order = result.rows[0];

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items with menu item details
    const itemsResult = await query(`
      SELECT
        oi.*,
        mi.name as menu_item_name,
        mi.category
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
    `, [id]);

    res.json({ ...order, items: itemsResult.rows });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', async (req, res) => {
  const client = await getClient();

  try {
    const { customer_name, notes, items } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Generate unique order ID (format: ko-xxxxxxxx)
    let orderId;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      orderId = generateOrderId();
      const existingResult = await query('SELECT id FROM orders WHERE order_id = $1', [orderId]);
      if (existingResult.rows.length === 0) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique order ID' });
    }

    // Calculate total and validate items
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const menuItemResult = await query('SELECT * FROM menu_items WHERE id = $1', [item.menu_item_id]);
      const menuItem = menuItemResult.rows[0];

      if (!menuItem) {
        return res.status(400).json({
          error: `Menu item with ID ${item.menu_item_id} not found`
        });
      }

      if (!menuItem.is_available) {
        return res.status(400).json({
          error: `${menuItem.name} is currently unavailable`
        });
      }

      const quantity = item.quantity || 1;
      const subtotal = parseFloat(menuItem.price) * quantity;
      totalAmount += subtotal;

      validatedItems.push({
        menu_item_id: item.menu_item_id,
        quantity,
        unit_price: menuItem.price,
        subtotal,
        special_instructions: item.special_instructions || null
      });
    }

    // Determine initial status based on user role
    // Client orders need approval, staff orders go directly to pending
    const initialStatus = req.user.role === 'client' ? 'awaiting_approval' : 'pending';

    // Determine field values based on user role
    let caissierName = null;
    let clientName = 'guest';
    let orderNotes = null;

    if (req.user.role === 'client') {
      // Client order
      clientName = req.user.name;
      orderNotes = notes || null;
    } else if (req.user.role === 'manager' || req.user.role === 'cashier') {
      // Staff order (cashier/manager)
      caissierName = req.user.name;
      clientName = 'guest';
      orderNotes = null;
    }

    // Create order in a transaction
    await client.query('BEGIN');

    try {
      // Insert order with all new fields
      const orderResult = await client.query(`
        INSERT INTO orders (
          order_id, order_number, status, total_amount, customer_name, notes,
          user_id, caissier_name, cuisinier_name, client_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        orderId,
        orderId, // Keep order_number same as order_id for compatibility
        initialStatus,
        totalAmount,
        customer_name || null,
        orderNotes,
        req.user.id,
        caissierName,
        null, // cuisinier_name - will be set when cook starts preparing
        clientName
      ]);

      const orderDbId = orderResult.rows[0].id;

      // Insert order items
      for (const item of validatedItems) {
        await client.query(`
          INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, special_instructions)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          orderDbId,
          item.menu_item_id,
          item.quantity,
          item.unit_price,
          item.subtotal,
          item.special_instructions
        ]);
      }

      await client.query('COMMIT');

      // Fetch the created order with items
      const newOrderResult = await query('SELECT * FROM orders WHERE id = $1', [orderDbId]);
      const newOrder = newOrderResult.rows[0];

      const orderItemsResult = await query(`
        SELECT
          oi.*,
          mi.name as item_name,
          mi.category
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = $1
      `, [orderDbId]);

      const createdOrder = { ...newOrder, items: orderItemsResult.rows };

      // Emit appropriate WebSocket event based on order status
      if (initialStatus === 'awaiting_approval') {
        // Client order - emit approval request
        emitOrderApprovalRequest(createdOrder);
      } else {
        // Staff order - emit new order directly to kitchen
        emitNewOrder(createdOrder);
      }

      res.status(201).json(createdOrder);
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/orders/:id
 * Update order status
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if order exists
    const existingResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    const existing = existingResult.rows[0];

    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate status
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    // Determine if we need to set cuisinier_name
    // Set when: status changes to 'preparing' AND cuisinier_name is NULL AND user is cook
    let cuisinierName = null;
    if (status === 'preparing' && !existing.cuisinier_name && req.user.role === 'cook') {
      cuisinierName = req.user.name;
    }

    // Update order
    if (cuisinierName) {
      await query(`
        UPDATE orders
        SET status = COALESCE($1, status),
            cuisinier_name = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [status || null, cuisinierName, id]);
    } else {
      await query(`
        UPDATE orders
        SET status = COALESCE($1, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [status || null, id]);
    }

    const updatedResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    const updatedOrder = updatedResult.rows[0];

    const itemsResult = await query(`
      SELECT
        oi.*,
        mi.name as item_name,
        mi.category
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
    `, [id]);

    const fullOrder = { ...updatedOrder, items: itemsResult.rows };

    // Emit WebSocket event for order status update
    emitOrderStatusUpdate(fullOrder);

    res.json(fullOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

/**
 * DELETE /api/orders/:id
 * Delete an order (and its items due to CASCADE)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    const existing = existingResult.rows[0];

    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await query('DELETE FROM orders WHERE id = $1', [id]);

    res.json({ message: 'Order deleted successfully', id });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
