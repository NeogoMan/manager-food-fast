import express from 'express';
import { query } from '../database/postgres.js';

const router = express.Router();

/**
 * GET /api/menu
 * Get all menu items or filter by category
 */
router.get('/', async (req, res) => {
  try {
    const { category, available } = req.query;
    let queryText = 'SELECT * FROM menu_items WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (category) {
      queryText += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (available !== undefined) {
      queryText += ` AND is_available = $${paramIndex}`;
      params.push(available === 'true');
    }

    queryText += ' ORDER BY category, name';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

/**
 * GET /api/menu/categories
 * Get all unique categories
 */
router.get('/categories', async (req, res) => {
  try {
    const result = await query('SELECT DISTINCT category FROM menu_items ORDER BY category');
    res.json(result.rows.map(c => c.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/menu/:id
 * Get a single menu item by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM menu_items WHERE id = $1', [id]);
    const item = result.rows[0];

    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});

/**
 * POST /api/menu
 * Create a new menu item
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, price, category, image_url, is_available } = req.body;

    // Validation
    if (!name || !price || !category) {
      return res.status(400).json({
        error: 'Missing required fields: name, price, category'
      });
    }

    if (price <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }

    const result = await query(`
      INSERT INTO menu_items (name, description, price, category, image_url, is_available)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      name,
      description || null,
      price,
      category,
      image_url || null,
      is_available !== undefined ? is_available : true
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

/**
 * PUT /api/menu/:id
 * Update a menu item
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, is_available } = req.body;

    // Check if item exists
    const existingResult = await query('SELECT * FROM menu_items WHERE id = $1', [id]);
    const existing = existingResult.rows[0];

    if (!existing) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Validation
    if (price !== undefined && price <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }

    await query(`
      UPDATE menu_items
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          price = COALESCE($3, price),
          category = COALESCE($4, category),
          image_url = COALESCE($5, image_url),
          is_available = COALESCE($6, is_available),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `, [
      name || null,
      description !== undefined ? description : null,
      price || null,
      category || null,
      image_url !== undefined ? image_url : null,
      is_available !== undefined ? is_available : null,
      id
    ]);

    const updatedResult = await query('SELECT * FROM menu_items WHERE id = $1', [id]);
    res.json(updatedResult.rows[0]);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

/**
 * DELETE /api/menu/:id
 * Delete a menu item
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const existingResult = await query('SELECT * FROM menu_items WHERE id = $1', [id]);
    const existing = existingResult.rows[0];

    if (!existing) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    await query('DELETE FROM menu_items WHERE id = $1', [id]);

    res.json({ message: 'Menu item deleted successfully', id });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;
