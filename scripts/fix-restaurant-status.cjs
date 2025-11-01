/**
 * Script to add 'status' field to all restaurants
 * This fixes the "restaurant not found" issue in validateRestaurantCode
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addStatusToRestaurants() {
  console.log('============================================================');
  console.log('   🔧 Fix Restaurant Status Fields');
  console.log('============================================================\n');

  try {
    // Get all restaurants
    console.log('🔍 Fetching all restaurants...\n');
    const restaurantsSnapshot = await db.collection('restaurants').get();

    if (restaurantsSnapshot.empty) {
      console.log('❌ No restaurants found in database');
      return;
    }

    console.log(`📊 Found ${restaurantsSnapshot.size} restaurant(s)\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Process each restaurant
    for (const doc of restaurantsSnapshot.docs) {
      const data = doc.data();
      const restaurantId = doc.id;
      const restaurantName = data.name || 'Unnamed';

      // Check if status field exists
      if (data.status) {
        console.log(`⏭️  Skipped: ${restaurantName} (${restaurantId}) - Already has status: ${data.status}`);
        skippedCount++;
        continue;
      }

      // Add status field as "active"
      await doc.ref.update({
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Updated: ${restaurantName} (${restaurantId}) - Status: active`);
      updatedCount++;
    }

    console.log('\n============================================================');
    console.log('✨ Summary:');
    console.log(`   - Total restaurants: ${restaurantsSnapshot.size}`);
    console.log(`   - Updated: ${updatedCount}`);
    console.log(`   - Skipped (already had status): ${skippedCount}`);
    console.log('============================================================\n');

    console.log('✅ All done! Restaurant status fields fixed.');
    console.log('💡 Now deploy Cloud Functions with: firebase deploy --only functions\n');

  } catch (error) {
    console.error('❌ Error updating restaurants:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
addStatusToRestaurants();
