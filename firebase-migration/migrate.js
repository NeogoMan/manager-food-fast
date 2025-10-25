import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', 'backend', '.env') });

/**
 * Firebase Migration Script
 * Migrates data from PostgreSQL to Firestore
 */

console.log('🔄 Starting Firebase Migration...\n');

// Initialize Firebase Admin
// You need to download service account key from Firebase Console
// Go to: Project Settings > Service Accounts > Generate New Private Key
try {
  const serviceAccount = await import('./serviceAccountKey.json', { assert: { type: 'json' } });

  initializeApp({
    credential: cert(serviceAccount.default)
  });

  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.log('\n⚠️  Please download your service account key:');
  console.log('   1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('   2. Click "Generate New Private Key"');
  console.log('   3. Save as firebase-migration/serviceAccountKey.json\n');
  process.exit(1);
}

const db = getFirestore();

// Initialize PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'restaurant_db',
  user: process.env.DB_USER || 'restaurant_user',
  password: process.env.DB_PASSWORD,
});

/**
 * Helper function to convert PostgreSQL timestamp to Firestore Timestamp
 */
function toTimestamp(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return Timestamp.fromDate(date);
}

/**
 * Migrate Users
 */
async function migrateUsers() {
  console.log('📝 Migrating Users...');

  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    const users = result.rows;

    console.log(`   Found ${users.length} users in PostgreSQL`);

    const batch = db.batch();
    let count = 0;

    for (const user of users) {
      // Create user document with custom ID
      const userRef = db.collection('users').doc(user.id.toString());

      batch.set(userRef, {
        username: user.username,
        passwordHash: user.password_hash,
        role: user.role,
        name: user.name,
        phone: user.phone || null,
        status: user.status || 'active',
        createdAt: toTimestamp(user.created_at) || Timestamp.now(),
        lastLogin: toTimestamp(user.last_login) || null,
      });

      count++;

      // Firestore batch limit is 500 operations
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`   Migrated ${count} users...`);
      }
    }

    // Commit remaining
    if (count % 500 !== 0) {
      await batch.commit();
    }

    console.log(`✅ Successfully migrated ${count} users\n`);
  } catch (error) {
    console.error('❌ Error migrating users:', error);
    throw error;
  }
}

/**
 * Migrate Menu Items
 */
async function migrateMenuItems() {
  console.log('📝 Migrating Menu Items...');

  try {
    const result = await pool.query('SELECT * FROM menu_items ORDER BY id');
    const menuItems = result.rows;

    console.log(`   Found ${menuItems.length} menu items in PostgreSQL`);

    const batch = db.batch();
    let count = 0;

    for (const item of menuItems) {
      const menuRef = db.collection('menu').doc(item.id.toString());

      batch.set(menuRef, {
        name: item.name,
        description: item.description || '',
        price: parseFloat(item.price),
        category: item.category || 'other',
        imageUrl: item.image_url || null,
        isAvailable: item.is_available !== false,
        createdAt: toTimestamp(item.created_at) || Timestamp.now(),
        updatedAt: toTimestamp(item.updated_at) || Timestamp.now(),
      });

      count++;

      if (count % 500 === 0) {
        await batch.commit();
        console.log(`   Migrated ${count} menu items...`);
      }
    }

    if (count % 500 !== 0) {
      await batch.commit();
    }

    console.log(`✅ Successfully migrated ${count} menu items\n`);
  } catch (error) {
    console.error('❌ Error migrating menu items:', error);
    throw error;
  }
}

/**
 * Migrate Orders
 */
async function migrateOrders() {
  console.log('📝 Migrating Orders...');

  try {
    const result = await pool.query(`
      SELECT
        o.*,
        json_agg(
          json_build_object(
            'menuItemId', oi.menu_item_id,
            'name', oi.name,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price,
            'subtotal', oi.subtotal,
            'specialInstructions', oi.special_instructions
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.id
    `);

    const orders = result.rows;

    console.log(`   Found ${orders.length} orders in PostgreSQL`);

    let count = 0;

    for (const order of orders) {
      const orderRef = db.collection('orders').doc(order.id.toString());

      // Parse items
      const items = order.items
        .filter(item => item.menuItemId !== null)
        .map(item => ({
          menuItemId: item.menuItemId?.toString() || null,
          name: item.name || '',
          quantity: parseInt(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          subtotal: parseFloat(item.subtotal) || 0,
          specialInstructions: item.specialInstructions || null,
        }));

      await orderRef.set({
        orderNumber: order.order_number,
        status: order.status || 'pending',
        totalAmount: parseFloat(order.total_amount) || 0,
        clientName: order.client_name || 'Guest',
        userId: order.user_id?.toString() || null,
        notes: order.notes || null,
        createdAt: toTimestamp(order.created_at) || Timestamp.now(),
        updatedAt: toTimestamp(order.updated_at) || Timestamp.now(),

        // Staff assignments
        caissierName: order.caissier_name || null,
        cuisinierName: order.cuisinier_name || null,
        approvedBy: order.approved_by?.toString() || null,
        approvedAt: toTimestamp(order.approved_at) || null,
        rejectionReason: order.rejection_reason || null,

        // Order items
        items: items,
      });

      count++;

      if (count % 50 === 0) {
        console.log(`   Migrated ${count} orders...`);
      }
    }

    console.log(`✅ Successfully migrated ${count} orders\n`);
  } catch (error) {
    console.error('❌ Error migrating orders:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  try {
    // Test PostgreSQL connection
    console.log('🔍 Testing PostgreSQL connection...');
    const testResult = await pool.query('SELECT NOW()');
    console.log(`✅ PostgreSQL connected: ${testResult.rows[0].now}\n`);

    // Test Firestore connection
    console.log('🔍 Testing Firestore connection...');
    await db.collection('_test').doc('test').set({ timestamp: Timestamp.now() });
    await db.collection('_test').doc('test').delete();
    console.log('✅ Firestore connected\n');

    // Run migrations
    await migrateUsers();
    await migrateMenuItems();
    await migrateOrders();

    console.log('✨ Migration completed successfully!\n');

    // Summary
    const usersCount = (await db.collection('users').count().get()).data().count;
    const menuCount = (await db.collection('menu').count().get()).data().count;
    const ordersCount = (await db.collection('orders').count().get()).data().count;

    console.log('📊 Summary:');
    console.log(`   Users: ${usersCount}`);
    console.log(`   Menu Items: ${menuCount}`);
    console.log(`   Orders: ${ordersCount}\n`);

    console.log('🎉 All data has been successfully migrated to Firestore!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('\n👋 PostgreSQL connection closed');
  }
}

// Run migration
runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
