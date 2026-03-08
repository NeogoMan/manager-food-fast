import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

/**
 * Restaurant Service
 * Handles all restaurant management operations for super admin
 */

/**
 * Create a new restaurant
 * @param {Object} restaurantData - Restaurant details
 * @param {string} restaurantData.name - Restaurant name
 * @param {string} restaurantData.email - Restaurant email
 * @param {string} restaurantData.phone - Restaurant phone
 * @param {Object} restaurantData.address - Restaurant address
 * @param {string} restaurantData.plan - Plan (basic|pro|enterprise)
 * @param {Object} restaurantData.adminUser - Admin user details (optional)
 * @returns {Promise<Object>} Created restaurant data
 */
export const createRestaurant = async (restaurantData) => {
  try {
    const createRestaurantFn = httpsCallable(functions, 'createRestaurant');
    const result = await createRestaurantFn(restaurantData);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a restaurant
 * @param {string} restaurantId - Restaurant ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Update result
 */
export const updateRestaurant = async (restaurantId, updates) => {
  try {
    const updateRestaurantFn = httpsCallable(functions, 'updateRestaurant');
    const result = await updateRestaurantFn({ restaurantId, updates });
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * List all restaurants
 * @returns {Promise<Array>} List of restaurants
 */
export const listRestaurants = async () => {
  try {
    const listRestaurantsFn = httpsCallable(functions, 'listRestaurants');
    const result = await listRestaurantsFn();
    return result.data.restaurants;
  } catch (error) {
    throw error;
  }
};

/**
 * Suspend or activate a restaurant
 * @param {string} restaurantId - Restaurant ID
 * @param {string} status - Status (active|suspended|cancelled)
 * @returns {Promise<Object>} Update result
 */
export const suspendRestaurant = async (restaurantId, status) => {
  try {
    const suspendRestaurantFn = httpsCallable(functions, 'suspendRestaurant');
    const result = await suspendRestaurantFn({ restaurantId, status });
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Toggle restaurant order acceptance
 * @param {string} restaurantId - Restaurant ID
 * @param {boolean} acceptingOrders - Whether to accept orders
 * @returns {Promise<Object>} Update result
 */
export const toggleRestaurantOrders = async (restaurantId, acceptingOrders) => {
  try {
    const toggleOrdersFn = httpsCallable(functions, 'toggleRestaurantOrders');
    const result = await toggleOrdersFn({ restaurantId, acceptingOrders });
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get restaurant settings (for checking order acceptance status)
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<Object>} Restaurant settings
 */
export const getRestaurantSettings = async (restaurantId) => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../config/firebase');
    const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));

    if (!restaurantDoc.exists()) {
      throw new Error('Restaurant not found');
    }

    return {
      id: restaurantDoc.id,
      ...restaurantDoc.data()
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get plan details and pricing
 * @returns {Array} Available plans with features
 */
export const getPlanDetails = () => {
  return [
    {
      id: 'standard',
      name: 'Standard',
      price: 399,
      currency: 'MAD',
      annualPrice: 3990,
      features: [
        'Gestion complète des commandes',
        'Affichage cuisine (KDS) avec glisser-déposer',
        'Commande en libre-service (QR Code)',
        'Suivi de commande en temps réel',
        'Tableau de bord & analytiques',
        'Gestion du menu avec images',
        'Impression tickets & reçus',
        'Utilisateurs illimités',
        'Support WhatsApp',
      ],
    },
  ];
};
