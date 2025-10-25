import express from 'express';
import {
  hashPassword,
  sanitizeUser,
  validateUsername,
  validatePassword,
  validatePhone,
  validateEmail
} from '../utils/auth.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../database/postgres.js';

const router = express.Router();

// All user routes require manager role
router.use(authenticate);
router.use(authorize('manager'));

const VALID_ROLES = ['manager', 'cashier', 'cook', 'client'];
const VALID_STATUSES = ['active', 'inactive', 'suspended'];

/**
 * GET /api/users
 * Get all users (managers only)
 */
router.get('/', async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let queryText = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (role) {
      queryText += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (name ILIKE $${paramIndex} OR username ILIKE $${paramIndex+1} OR phone ILIKE $${paramIndex+2} OR email ILIKE $${paramIndex+3})`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      paramIndex += 4;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    const sanitized = result.rows.map(user => sanitizeUser(user));

    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Échec de la récupération des utilisateurs' });
  }
});

/**
 * GET /api/users/:id
 * Get a single user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Échec de la récupération de l\'utilisateur' });
  }
});

/**
 * POST /api/users
 * Create a new user (manager only)
 */
router.post('/', async (req, res) => {
  try {
    const { username, password, role, name, phone, email, status } = req.body;

    // Validation
    if (!username || !password || !role || !name) {
      return res.status(400).json({
        error: 'Champs requis manquants',
        message: 'Nom d\'utilisateur, mot de passe, rôle et nom sont requis'
      });
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({
        error: 'Nom d\'utilisateur invalide',
        message: usernameValidation.message
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Mot de passe invalide',
        message: passwordValidation.message
      });
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        error: 'Rôle invalide',
        message: `Le rôle doit être: ${VALID_ROLES.join(', ')}`
      });
    }

    // Validate phone if provided
    if (phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        return res.status(400).json({
          error: 'Numéro de téléphone invalide',
          message: phoneValidation.message
        });
      }
    }

    // Validate email if provided
    if (email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({
          error: 'Email invalide',
          message: emailValidation.message
        });
      }
    }

    // Check if username already exists
    const existingUserResult = await query('SELECT id FROM users WHERE username = $1', [username]);
    const existingUser = existingUserResult.rows[0];

    if (existingUser) {
      return res.status(409).json({
        error: 'Nom d\'utilisateur existant',
        message: 'Ce nom d\'utilisateur est déjà utilisé'
      });
    }

    // Check if email already exists
    if (email) {
      const existingEmailResult = await query('SELECT id FROM users WHERE email = $1', [email]);
      const existingEmail = existingEmailResult.rows[0];

      if (existingEmail) {
        return res.status(409).json({
          error: 'Email existant',
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const result = await query(`
      INSERT INTO users (username, password_hash, role, name, phone, email, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      username,
      password_hash,
      role,
      name,
      phone || null,
      email || null,
      status || 'active',
      req.user.id
    ]);

    const newUser = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: sanitizeUser(newUser)
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Échec de la création de l\'utilisateur' });
  }
});

/**
 * PUT /api/users/:id
 * Update a user
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, name, phone, email, status } = req.body;

    // Check if user exists
    const existingResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    const existing = existingResult.rows[0];

    if (!existing) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Validate username if changing
    if (username && username !== existing.username) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        return res.status(400).json({
          error: 'Nom d\'utilisateur invalide',
          message: usernameValidation.message
        });
      }

      // Check if new username is taken
      const existingUsernameResult = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
      const existingUsername = existingUsernameResult.rows[0];

      if (existingUsername) {
        return res.status(409).json({
          error: 'Nom d\'utilisateur existant',
          message: 'Ce nom d\'utilisateur est déjà utilisé'
        });
      }
    }

    // Validate role if changing
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        error: 'Rôle invalide',
        message: `Le rôle doit être: ${VALID_ROLES.join(', ')}`
      });
    }

    // Validate status if changing
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'Statut invalide',
        message: `Le statut doit être: ${VALID_STATUSES.join(', ')}`
      });
    }

    // Validate phone if provided
    if (phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        return res.status(400).json({
          error: 'Numéro de téléphone invalide',
          message: phoneValidation.message
        });
      }
    }

    // Validate email if changing
    if (email && email !== existing.email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({
          error: 'Email invalide',
          message: emailValidation.message
        });
      }

      // Check if new email is taken
      const existingEmailResult = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      const existingEmail = existingEmailResult.rows[0];

      if (existingEmail) {
        return res.status(409).json({
          error: 'Email existant',
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (username) {
      updates.push(`username = $${paramIndex}`);
      params.push(username);
      paramIndex++;
    }
    if (name) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }
    if (role) {
      updates.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      params.push(phone || null);
      paramIndex++;
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      params.push(email || null);
      paramIndex++;
    }
    if (status) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Handle password update separately
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          error: 'Mot de passe invalide',
          message: passwordValidation.message
        });
      }

      const password_hash = await hashPassword(password);
      updates.push(`password_hash = $${paramIndex}`);
      params.push(password_hash);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Aucune modification',
        message: 'Aucun champ à mettre à jour'
      });
    }

    params.push(id);

    await query(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, params);

    const updatedUserResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    const updatedUser = updatedUserResult.rows[0];

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: sanitizeUser(updatedUser)
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Échec de la mise à jour de l\'utilisateur' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    const existing = existingResult.rows[0];

    if (!existing) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Cannot delete yourself
    if (parseInt(id) === req.user.id) {
      return res.status(403).json({
        error: 'Action non autorisée',
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Check if user has orders
    const ordersCountResult = await query('SELECT COUNT(*) as count FROM orders WHERE user_id = $1', [id]);
    const ordersCount = ordersCountResult.rows[0];

    if (ordersCount && parseInt(ordersCount.count) > 0) {
      return res.status(409).json({
        error: 'Suppression impossible',
        message: 'Cet utilisateur a des commandes associées. Veuillez les supprimer d\'abord ou désactiver l\'utilisateur.'
      });
    }

    // Delete user
    await query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
      id
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Échec de la suppression de l\'utilisateur' });
  }
});

/**
 * GET /api/users/role/:role
 * Get all users by role
 */
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        error: 'Rôle invalide',
        message: `Le rôle doit être: ${VALID_ROLES.join(', ')}`
      });
    }

    const result = await query('SELECT * FROM users WHERE role = $1 ORDER BY name', [role]);
    const sanitized = result.rows.map(user => sanitizeUser(user));

    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({ error: 'Échec de la récupération des utilisateurs' });
  }
});

export default router;
