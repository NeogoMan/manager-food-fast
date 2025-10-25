/**
 * Cloud Functions Service
 * Wrapper for Firebase Cloud Functions
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

/**
 * User Management Functions (Manager only)
 */
export const userFunctions = {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.username - Username
   * @param {string} userData.password - Password
   * @param {string} userData.role - Role (manager, cashier, cook, client)
   * @param {string} userData.name - Full name
   * @param {string} userData.phone - Phone number (optional)
   */
  async create(userData) {
    try {
      const createUser = httpsCallable(functions, 'createUser');
      const result = await createUser(userData);
      return result.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(error.message || 'Failed to create user');
    }
  },

  /**
   * Set user role
   * @param {string} userId - User ID
   * @param {string} role - New role
   */
  async setRole(userId, role) {
    try {
      const setUserRole = httpsCallable(functions, 'setUserRole');
      const result = await setUserRole({ userId, role });
      return result.data;
    } catch (error) {
      console.error('Error setting user role:', error);
      throw new Error(error.message || 'Failed to update user role');
    }
  },

  /**
   * Update user status (active/inactive)
   * @param {string} userId - User ID
   * @param {string} status - Status (active or inactive)
   */
  async updateStatus(userId, status) {
    try {
      const updateUserStatus = httpsCallable(functions, 'updateUserStatus');
      const result = await updateUserStatus({ userId, status });
      return result.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error(error.message || 'Failed to update user status');
    }
  },
};

export default {
  user: userFunctions,
};
