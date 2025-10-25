import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
export function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, message: string }
 */
export function validatePassword(password) {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins 8 caractères'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins une lettre majuscule'
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins un chiffre'
    };
  }

  return { valid: true, message: 'Mot de passe valide' };
}

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateUsername(username) {
  if (!username || username.length < 3) {
    return {
      valid: false,
      message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
    };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      valid: false,
      message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores'
    };
  }

  return { valid: true, message: 'Nom d\'utilisateur valide' };
}

/**
 * Validate phone number (Moroccan format)
 * @param {string} phone - Phone number to validate
 * @returns {Object} { valid: boolean, message: string }
 */
export function validatePhone(phone) {
  if (!phone) {
    return { valid: true, message: 'Téléphone optionnel' }; // Phone is optional
  }

  // Moroccan phone format: +212XXXXXXXXX or 0XXXXXXXXX or 06XX-XXXXXX
  const phoneRegex = /^(\+212|0)[5-7][0-9]{8}$/;
  const formattedRegex = /^0[5-7]\d{2}-\d{6}$/;

  const cleanPhone = phone.replace(/[\s-]/g, '');

  if (phoneRegex.test(cleanPhone) || formattedRegex.test(phone)) {
    return { valid: true, message: 'Numéro de téléphone valide' };
  }

  return {
    valid: false,
    message: 'Format de téléphone invalide (ex: 0612345678 ou +212612345678)'
  };
}

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateEmail(email) {
  if (!email) {
    return { valid: true, message: 'Email optionnel' }; // Email is optional
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (emailRegex.test(email)) {
    return { valid: true, message: 'Email valide' };
  }

  return {
    valid: false,
    message: 'Format d\'email invalide'
  };
}

/**
 * Sanitize user data before sending to client (remove sensitive fields)
 * @param {Object} user - User object
 * @returns {Object} Sanitized user object
 */
export function sanitizeUser(user) {
  const { password_hash, ...sanitized } = user;
  return sanitized;
}
