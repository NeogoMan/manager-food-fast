import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../database/postgres.js';

const router = express.Router();

// Apply authentication and manager-only authorization to all routes
router.use(authenticate);
router.use(authorize('manager'));

/**
 * GET /api/dashboard/statistics
 * Get dashboard statistics with optional filters
 * Manager only
 */
router.get('/statistics', async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      caissier,
      cuisinier,
      product,
      status
    } = req.query;

    // Build base WHERE clause for filtering
    const buildWhereClause = () => {
      const conditions = ['1=1'];
      const params = [];
      let paramIndex = 1;

      if (start_date) {
        conditions.push(`o.created_at >= $${paramIndex}`);
        params.push(start_date + ' 00:00:00');
        paramIndex++;
      }

      if (end_date) {
        conditions.push(`o.created_at <= $${paramIndex}`);
        params.push(end_date + ' 23:59:59');
        paramIndex++;
      }

      if (caissier && caissier !== 'all') {
        if (caissier === 'guest') {
          conditions.push('o.caissier_name IS NOT NULL');
        } else {
          conditions.push(`o.caissier_name = $${paramIndex}`);
          params.push(caissier);
          paramIndex++;
        }
      }

      if (cuisinier && cuisinier !== 'all') {
        if (cuisinier === 'unassigned') {
          conditions.push('o.cuisinier_name IS NULL');
        } else {
          conditions.push(`o.cuisinier_name = $${paramIndex}`);
          params.push(cuisinier);
          paramIndex++;
        }
      }

      if (status && status !== 'all') {
        conditions.push(`o.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      return { whereClause: conditions.join(' AND '), params, paramIndex };
    };

    const { whereClause, params, paramIndex } = buildWhereClause();

    // 1. Summary Statistics
    const summaryResult = await query(`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN status NOT IN ('cancelled', 'rejected') THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status NOT IN ('cancelled', 'rejected') THEN total_amount END), 0) as average_order_value,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status IN ('awaiting_approval', 'pending', 'preparing', 'ready') THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status IN ('cancelled', 'rejected') THEN 1 END) as cancelled_orders
      FROM orders o
      WHERE ${whereClause}
    `, params);
    const summary = summaryResult.rows[0];

    // 2. Orders by Status (uses whereClause twice, so need params twice)
    const ordersByStatusResult = await query(`
      SELECT
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders o2 WHERE ${whereClause}), 1) as percentage
      FROM orders o
      WHERE ${whereClause}
      GROUP BY status
      ORDER BY count DESC
    `, [...params, ...params]);
    const ordersByStatus = ordersByStatusResult.rows;

    // 3. Revenue Over Time (last 30 days or filtered range)
    const revenueOverTimeResult = await query(`
      SELECT
        DATE(created_at) as date,
        COALESCE(SUM(CASE WHEN status NOT IN ('cancelled', 'rejected') THEN total_amount ELSE 0 END), 0) as revenue,
        COUNT(*) as order_count
      FROM orders o
      WHERE ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
      LIMIT 30
    `, params);
    const revenueOverTime = revenueOverTimeResult.rows;

    // 4. Top Products
    let topProductsQuery = `
      SELECT
        mi.name as product_name,
        SUM(oi.quantity) as total_quantity,
        COALESCE(SUM(oi.subtotal), 0) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE ${whereClause}
    `;

    // Create a copy of params for this specific query
    const topProductsParams = [...params];
    let topProductsParamIndex = paramIndex;

    // Add product filter if specified
    if (product && product !== 'all') {
      topProductsQuery += ` AND mi.name = $${topProductsParamIndex}`;
      topProductsParams.push(product);
      topProductsParamIndex++;
    }

    topProductsQuery += `
      GROUP BY mi.name
      ORDER BY total_quantity DESC
      LIMIT 10
    `;

    const topProductsResult = await query(topProductsQuery, topProductsParams);
    const topProducts = topProductsResult.rows;

    // Calculate percentage for top products
    const totalProductRevenue = topProducts.reduce((sum, p) => sum + p.total_revenue, 0);
    const topProductsWithPercentage = topProducts.map(p => ({
      ...p,
      percentage: totalProductRevenue > 0 ? Math.round((p.total_revenue / totalProductRevenue) * 100) : 0
    }));

    // 5. Orders by Caissier
    const ordersByCaissierResult = await query(`
      SELECT
        COALESCE(caissier_name, 'Non assigné') as caissier_name,
        COUNT(*) as order_count,
        COALESCE(SUM(CASE WHEN status NOT IN ('cancelled', 'rejected') THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status NOT IN ('cancelled', 'rejected') THEN total_amount END), 0) as average_order_value
      FROM orders o
      WHERE ${whereClause}
      GROUP BY caissier_name
      ORDER BY order_count DESC
    `, params);
    const ordersByCaissier = ordersByCaissierResult.rows;

    // 6. Orders by Cuisinier
    const ordersByCuisinierResult = await query(`
      SELECT
        COALESCE(cuisinier_name, 'Non assigné') as cuisinier_name,
        COUNT(*) as orders_prepared
      FROM orders o
      WHERE ${whereClause}
        AND status IN ('preparing', 'ready', 'completed')
      GROUP BY cuisinier_name
      ORDER BY orders_prepared DESC
    `, params);
    const ordersByCuisinier = ordersByCuisinierResult.rows;

    // 7. Orders by Client Type
    const ordersByClientTypeResult = await query(`
      SELECT
        CASE
          WHEN client_name = 'guest' THEN 'guest'
          ELSE 'registered'
        END as client_type,
        COUNT(*) as count
      FROM orders o
      WHERE ${whereClause}
      GROUP BY client_type
    `, params);
    const ordersByClientType = ordersByClientTypeResult.rows;

    const clientTypeStats = {
      registered: ordersByClientType.find(c => c.client_type === 'registered')?.count || 0,
      guest: ordersByClientType.find(c => c.client_type === 'guest')?.count || 0
    };

    // 8. Recent Orders
    const recentOrdersResult = await query(`
      SELECT
        o.order_id,
        o.created_at,
        o.client_name,
        o.status,
        o.total_amount
      FROM orders o
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT 20
    `, params);
    const recentOrders = recentOrdersResult.rows;

    // Return all statistics
    res.json({
      summary: {
        total_orders: summary.total_orders || 0,
        total_revenue: summary.total_revenue || 0,
        average_order_value: summary.average_order_value || 0,
        completed_orders: summary.completed_orders || 0,
        pending_orders: summary.pending_orders || 0,
        cancelled_orders: summary.cancelled_orders || 0,
        completed_percentage: summary.total_orders > 0
          ? Math.round((summary.completed_orders / summary.total_orders) * 100)
          : 0
      },
      orders_by_status: ordersByStatus,
      revenue_over_time: revenueOverTime,
      top_products: topProductsWithPercentage,
      orders_by_caissier: ordersByCaissier,
      orders_by_cuisinier: ordersByCuisinier,
      client_type_stats: clientTypeStats,
      recent_orders: recentOrders,
      filters_applied: {
        start_date: start_date || null,
        end_date: end_date || null,
        caissier: caissier || 'all',
        cuisinier: cuisinier || 'all',
        product: product || 'all',
        status: status || 'all'
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * GET /api/dashboard/filters
 * Get available filter options (unique values)
 * Manager only
 */
router.get('/filters', async (req, res) => {
  try {
    // Get unique caissiers
    const caissiersResult = await query(`
      SELECT DISTINCT caissier_name
      FROM orders
      WHERE caissier_name IS NOT NULL
      ORDER BY caissier_name
    `);
    const caissiers = caissiersResult.rows.map(row => row.caissier_name);

    // Get unique cuisiniers
    const cuisiniersResult = await query(`
      SELECT DISTINCT cuisinier_name
      FROM orders
      WHERE cuisinier_name IS NOT NULL
      ORDER BY cuisinier_name
    `);
    const cuisiniers = cuisiniersResult.rows.map(row => row.cuisinier_name);

    // Get all products from menu
    const productsResult = await query(`
      SELECT DISTINCT name
      FROM menu_items
      WHERE is_available = true
      ORDER BY name
    `);
    const products = productsResult.rows.map(row => row.name);

    res.json({
      caissiers,
      cuisiniers,
      products
    });

  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

export default router;
