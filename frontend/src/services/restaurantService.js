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
 * Get plan details and pricing
 * @returns {Array} Available plans with features
 */
export const getPlanDetails = () => {
  return [
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      features: [
        'Up to 3 staff users',
        'Basic ordering system',
        'Email support',
        'Web dashboard',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 79,
      popular: true,
      features: [
        'Unlimited staff users',
        'Mobile app access',
        'Advanced analytics',
        'Priority support',
        'Kitchen display',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      features: [
        'Everything in Pro',
        'Multi-location support',
        'Custom branding',
        'API access',
        'Dedicated support',
        'Custom integrations',
      ],
    },
  ];
};
