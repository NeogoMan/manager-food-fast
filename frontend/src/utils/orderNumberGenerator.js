import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Generate a sequential order number that resets monthly
 * Format: 4-digit padded number (0001-9999)
 * Resets: First day of each month
 * Scope: Per restaurant
 *
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<string>} Sequential order number (e.g., "0001", "0047", "1234")
 */
export async function generateSequentialOrderNumber(restaurantId) {
  try {
    // Get current month in YYYY-MM format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Counter document ID: restaurantId + month
    const counterId = `${restaurantId}_${currentMonth}`;
    const counterRef = doc(db, 'order_counters', counterId);

    // Use Firestore transaction for atomic increment
    const orderNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      if (!counterDoc.exists()) {
        // New month or first order - start from 1
        const initialData = {
          restaurantId,
          month: currentMonth,
          counter: 1,
          lastReset: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(counterRef, initialData);
        console.log(`✅ Created new monthly counter for ${restaurantId} - ${currentMonth}: #0001`);
        return 1;
      } else {
        // Increment existing counter
        const currentCounter = counterDoc.data().counter || 0;
        const newCounter = currentCounter + 1;

        // Check if we've exceeded 9999 (monthly limit)
        if (newCounter > 9999) {
          throw new Error('Monthly order limit reached (9999 orders). Counter will reset next month.');
        }

        transaction.update(counterRef, {
          counter: newCounter,
          updatedAt: serverTimestamp(),
        });

        console.log(`✅ Generated order number for ${restaurantId}: #${String(newCounter).padStart(4, '0')}`);
        return newCounter;
      }
    });

    // Format as 4-digit padded string
    return String(orderNumber).padStart(4, '0');

  } catch (error) {
    console.error('❌ Error generating sequential order number:', error);

    // Fallback: Use timestamp-based 4-digit number
    const fallback = (Date.now() % 10000).toString().padStart(4, '0');
    console.warn(`⚠️ Using fallback order number: ${fallback}`);
    return fallback;
  }
}

/**
 * Format order number for display (adds # prefix)
 * @param {string} orderNumber - Order number (e.g., "0001")
 * @returns {string} Formatted order number (e.g., "#0001")
 */
export function formatOrderNumber(orderNumber) {
  return `#${orderNumber}`;
}

/**
 * Get current month's counter status for a restaurant
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<{month: string, counter: number, lastReset: Date} | null>}
 */
export async function getCurrentMonthCounter(restaurantId) {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const counterId = `${restaurantId}_${currentMonth}`;

    const counterRef = doc(db, 'order_counters', counterId);
    const counterSnap = await counterRef.get();

    if (!counterSnap.exists()) {
      return null;
    }

    const data = counterSnap.data();
    return {
      month: data.month,
      counter: data.counter,
      lastReset: data.lastReset?.toDate(),
    };
  } catch (error) {
    console.error('Error getting current month counter:', error);
    return null;
  }
}
