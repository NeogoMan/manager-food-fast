const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkMenuItems() {
  console.log('🔍 Checking menu items for restaurantId field...\n');

  try {
    // Get all menu items
    const menuSnapshot = await db.collection('menu').get();

    console.log(`📊 Total menu items: ${menuSnapshot.size}\n`);

    if (menuSnapshot.empty) {
      console.log('ℹ️  No menu items found in the database.\n');
      process.exit(0);
    }

    // Check for items without restaurantId
    const itemsWithoutRestaurant = [];
    const itemsByRestaurant = {};

    menuSnapshot.forEach(doc => {
      const data = doc.data();
      const restaurantId = data.restaurantId;

      if (!restaurantId) {
        itemsWithoutRestaurant.push({
          id: doc.id,
          name: data.name,
          category: data.category,
          price: data.price
        });
      } else {
        if (!itemsByRestaurant[restaurantId]) {
          itemsByRestaurant[restaurantId] = [];
        }
        itemsByRestaurant[restaurantId].push({
          id: doc.id,
          name: data.name
        });
      }
    });

    // Display results
    console.log('═══════════════════════════════════════════════');
    console.log('📋 MENU ITEMS BY RESTAURANT');
    console.log('═══════════════════════════════════════════════\n');

    const restaurantIds = Object.keys(itemsByRestaurant);

    if (restaurantIds.length > 0) {
      for (const restaurantId of restaurantIds) {
        const items = itemsByRestaurant[restaurantId];
        console.log(`🏪 Restaurant: ${restaurantId}`);
        console.log(`   Items: ${items.length}`);
        console.log('   Sample items:');
        items.slice(0, 3).forEach(item => {
          console.log(`   - ${item.name} (${item.id})`);
        });
        if (items.length > 3) {
          console.log(`   ... and ${items.length - 3} more`);
        }
        console.log('');
      }
    }

    // Display items without restaurant
    if (itemsWithoutRestaurant.length > 0) {
      console.log('═══════════════════════════════════════════════');
      console.log('⚠️  ITEMS WITHOUT RESTAURANT ID');
      console.log('═══════════════════════════════════════════════\n');
      console.log(`Found ${itemsWithoutRestaurant.length} item(s) without restaurantId:\n`);

      itemsWithoutRestaurant.forEach(item => {
        console.log(`❌ ${item.name}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   Category: ${item.category || 'N/A'}`);
        console.log(`   Price: ${item.price || 'N/A'} DH\n`);
      });

      console.log('⚠️  ACTION REQUIRED:');
      console.log('   These items need to be assigned to a restaurant or deleted.');
      console.log('   Run the migration script to fix this.\n');
    } else {
      console.log('═══════════════════════════════════════════════');
      console.log('✅ ALL MENU ITEMS HAVE RESTAURANT ID');
      console.log('═══════════════════════════════════════════════\n');
      console.log('All menu items are properly assigned to restaurants.\n');
    }

    // Summary
    console.log('📊 Summary:');
    console.log(`   Total items: ${menuSnapshot.size}`);
    console.log(`   Restaurants: ${restaurantIds.length}`);
    console.log(`   Items without restaurant: ${itemsWithoutRestaurant.length}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error checking menu items:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkMenuItems();
