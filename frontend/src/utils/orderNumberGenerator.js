import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Generate a random 4-digit order number (0001-9999)
 */
function generateRandomNumber() {
  const num = Math.floor(Math.random() * 10000);
  return num.toString().padStart(4, '0');
}

/**
 * Check if an order number already exists in Firestore
 */
async function orderNumberExists(restaurantId, orderNumber) {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('restaurantId', '==', restaurantId),
      where('orderNumber', '==', orderNumber)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking order number:', error);
    return false;
  }
}

/**
 * Generate a unique 4-digit order number for a restaurant
 * Retries up to maxRetries times if collision occurs
 */
export async function generateUniqueOrderNumber(restaurantId, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    const orderNumber = generateRandomNumber();

    const exists = await orderNumberExists(restaurantId, orderNumber);

    if (!exists) {
      console.log(`✅ Generated unique order number: ${orderNumber}`);
      return orderNumber;
    }

    console.log(`⚠️ Order number ${orderNumber} already exists, retrying...`);
  }

  // Fallback: if all retries fail, use timestamp-based number
  const fallback = (Date.now() % 10000).toString().padStart(4, '0');
  console.warn(`⚠️ Using fallback order number: ${fallback}`);
  return fallback;
}

/**
 * Format order number for display (adds # prefix)
 */
export function formatOrderNumber(orderNumber) {
  return `#${orderNumber}`;
}
