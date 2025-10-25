import express from 'express';
import { comparePassword, generateToken, sanitizeUser } from '../utils/auth.js';
import { authenticate } from '../middleware/auth.js';
import { query } from '../database/postgres.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    // Find user by username
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: 'Identifiants invalides',
        message: 'Nom d\'utilisateur ou mot de passe incorrect'
      });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Compte désactivé',
        message: 'Votre compte a été désactivé. Contactez un administrateur.'
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Identifiants invalides',
        message: 'Nom d\'utilisateur ou mot de passe incorrect'
      });
    }

    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate JWT token
    const token = generateToken(user);

    // Return token and sanitized user data
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: sanitizeUser(user)
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de se connecter. Veuillez réessayer.'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal, server just confirms)
 */
router.post('/logout', authenticate, (req, res) => {
  try {
    // In a JWT-based system, logout is primarily handled client-side
    // The token will be removed from client storage
    // Here we just confirm the logout
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de se déconnecter'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user's information
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // Get full user data from database
    const result = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur introuvable',
        message: 'Votre compte n\'existe plus'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Compte désactivé',
        message: 'Votre compte a été désactivé'
      });
    }

    res.json({
      success: true,
      user: sanitizeUser(user)
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les informations utilisateur'
    });
  }
});

/**
 * PUT /api/auth/change-password
 * Change current user's password
 */
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Mot de passe faible',
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
      });
    }

    // Get user from database
    const result = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur introuvable'
      });
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Mot de passe incorrect',
        message: 'Le mot de passe actuel est incorrect'
      });
    }

    // Hash new password
    const { hashPassword } = await import('../utils/auth.js');
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, user.id]);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de modifier le mot de passe'
    });
  }
});

export default router;
