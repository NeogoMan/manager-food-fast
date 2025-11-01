/**
 * Script to generate and assign unique short codes to restaurants
 * Run with: node scripts/generate-restaurant-codes.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Generate a random uppercase alphanumeric code
 * @param {number} length - Length of the code (default: 6)
 * @returns {string} Generated code
 */
function generateCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if a code already exists
 * @param {string} code - Code to check
 * @returns {Promise<boolean>} True if code exists
 */
async function codeExists(code) {
  const snapshot = await db.collection('restaurants')
    .where('shortCode', '==', code)
    .limit(1)
    .get();

  return !snapshot.empty;
}

/**
 * Generate a unique code that doesn't exist in database
 * @param {number} length - Length of the code
 * @returns {Promise<string>} Unique code
 */
async function generateUniqueCode(length = 6) {
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    const code = generateCode(length);
    const exists = await codeExists(code);

    if (!exists) {
      return code;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique code after maximum attempts');
}

/**
 * Main function to generate codes for all restaurants
 */
async function generateCodesForRestaurants() {
  try {
    console.log('🔍 Fetching restaurants without short codes...\n');

    // Get all restaurants
    const restaurantsSnapshot = await db.collection('restaurants').get();

    if (restaurantsSnapshot.empty) {
      console.log('❌ No restaurants found in database.');
      return;
    }

    console.log(`📊 Found ${restaurantsSnapshot.size} restaurant(s)\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const doc of restaurantsSnapshot.docs) {
      const restaurant = doc.data();
      const restaurantId = doc.id;
      const restaurantName = restaurant.name || 'Unknown';

      // Skip if restaurant already has a short code
      if (restaurant.shortCode) {
        console.log(`⏭️  Skipped: ${restaurantName} (${restaurantId}) - Already has code: ${restaurant.shortCode}`);
        skippedCount++;
        continue;
      }

      // Generate unique code
      const code = await generateUniqueCode(6);

      // Update restaurant with short code
      await db.collection('restaurants').doc(restaurantId).update({
        shortCode: code,
        updatedAt: new Date()
      });

      console.log(`✅ Updated: ${restaurantName} (${restaurantId}) - Code: ${code}`);
      updatedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Summary:`);
    console.log(`   - Total restaurants: ${restaurantsSnapshot.size}`);
    console.log(`   - Updated: ${updatedCount}`);
    console.log(`   - Skipped (already had code): ${skippedCount}`);
    console.log('='.repeat(60) + '\n');

    console.log('✅ All done! Restaurant codes generated successfully.');

  } catch (error) {
    console.error('❌ Error generating restaurant codes:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await admin.app().delete();
  }
}

// Run the script
console.log('\n' + '='.repeat(60));
console.log('   🍔 Generate Restaurant Short Codes');
console.log('='.repeat(60) + '\n');

generateCodesForRestaurants();
