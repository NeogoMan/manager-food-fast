/**
 * PostgreSQL to Firestore Data Migration Script
 * Migrates menu items, users, and orders from PostgreSQL to Firestore
 *
 * Usage: node firebase-migration/migrate-data.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import pg from 'pg';
import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';

const { Pool } = pg;

// PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'restaurant_db',
  user: 'restaurant_user',
  password: 'Restaurant2024!SecurePass',
});

async function migrateData() {
  try {
    console.log('🔄 Starting PostgreSQL to Firestore migration...\n');

    // Load service account key
    let serviceAccount;
    try {
      const serviceAccountFile = readFileSync('./firebase-migration/serviceAccountKey.json', 'utf8');
      serviceAccount = JSON.parse(serviceAccountFile);
    } catch (error) {
      console.log('⚠️  Service account key not found.');
      console.log('📥 Please download your service account key:');
      console.log('1. Go to: https://console.firebase.google.com/project/fast-food-manager-b1f54/settings/serviceaccounts/adminsdk');
      console.log('2. Click "Generate New Private Key"');
      console.log('3. Save as: firebase-migration/serviceAccountKey.json');
      console.log('4. Run this script again\n');
      process.exit(1);
    }

    // Initialize Firebase Admin
    initializeApp({
      credential: cert(serviceAccount),
      projectId: 'fast-food-manager-b1f54'
    });

    const db = getFirestore();
    const auth = getAuth();

    // Test PostgreSQL connection
    console.log('🔌 Connecting to PostgreSQL...');
    const pgClient = await pool.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // ==========================================
    // 1. MIGRATE MENU ITEMS
    // ==========================================
    console.log('📋 Migrating menu items...');
    const menuResult = await pgClient.query('SELECT * FROM menu_items ORDER BY id');
    console.log(`   Found ${menuResult.rows.length} menu items in PostgreSQL`);

    let menuCount = 0;
    for (const row of menuResult.rows) {
      await db.collection('menu').add({
        name: row.name,
        category: row.category,
        description: row.description || '',
        price: parseFloat(row.price),
        isAvailable: row.is_available,
        preparationTime: row.preparation_time || 10,
        image: row.image || null,
        createdAt: row.created_at ? Timestamp.fromDate(new Date(row.created_at)) : Timestamp.now(),
        updatedAt: row.updated_at ? Timestamp.fromDate(new Date(row.updated_at)) : Timestamp.now(),
      });
      menuCount++;
      console.log(`   ✅ Migrated: ${row.name} (${row.category}) - ${row.price} MAD`);
    }
    console.log(`✅ Migrated ${menuCount} menu items\n`);

    // ==========================================
    // 2. MIGRATE USERS (if any)
    // ==========================================
    console.log('👥 Migrating users...');
    const usersResult = await pgClient.query('SELECT * FROM users ORDER BY id');
    console.log(`   Found ${usersResult.rows.length} users in PostgreSQL`);

    let usersCount = 0;
    for (const row of usersResult.rows) {
      try {
        // Check if user already exists in Firestore
        const existingUser = await db.collection('users')
          .where('username', '==', row.username)
          .limit(1)
          .get();

        if (!existingUser.empty) {
          console.log(`   ⏭️  Skipped: ${row.username} (already exists)`);
          continue;
        }

        // Create user in Firebase Authentication
        const userRecord = await auth.createUser({
          uid: db.collection('users').doc().id,
          disabled: row.status !== 'active',
        });

        // Set custom claims
        await auth.setCustomUserClaims(userRecord.uid, {
          role: row.role,
          username: row.username,
          name: row.name,
          phone: row.phone,
        });

        // Create user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
          username: row.username,
          passwordHash: row.password_hash,
          role: row.role,
          name: row.name,
          phone: row.phone || null,
          status: row.status || 'active',
          createdAt: row.created_at ? Timestamp.fromDate(new Date(row.created_at)) : Timestamp.now(),
          lastLogin: row.last_login ? Timestamp.fromDate(new Date(row.last_login)) : null,
        });

        usersCount++;
        console.log(`   ✅ Migrated: ${row.username} (${row.role})`);
      } catch (error) {
        console.log(`   ❌ Failed to migrate user ${row.username}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${usersCount} users\n`);

    // ==========================================
    // 3. MIGRATE ORDERS
    // ==========================================
    console.log('🛒 Migrating orders...');
    const ordersResult = await pgClient.query(`
      SELECT o.*,
        json_agg(
          json_build_object(
            'menuItemId', oi.menu_item_id,
            'name', mi.name,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price,
            'subtotal', oi.subtotal
          ) ORDER BY oi.id
        ) FILTER (WHERE oi.id IS NOT NULL) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      GROUP BY o.id
      ORDER BY o.id
    `);
    console.log(`   Found ${ordersResult.rows.length} orders in PostgreSQL`);

    let ordersCount = 0;
    for (const row of ordersResult.rows) {
      // Calculate item count from items array
      const items = row.items || [];
      const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

      await db.collection('orders').add({
        orderNumber: row.order_number,
        customerName: row.customer_name || null,
        userId: null, // Old orders won't have Firebase user IDs
        status: row.status,
        totalAmount: parseFloat(row.total_amount),
        itemCount: itemCount,
        notes: row.notes || null,
        items: items,
        createdAt: row.created_at ? Timestamp.fromDate(new Date(row.created_at)) : Timestamp.now(),
        updatedAt: row.updated_at ? Timestamp.fromDate(new Date(row.updated_at)) : Timestamp.now(),
      });
      ordersCount++;
      console.log(`   ✅ Migrated: ${row.order_number} (${row.status}) - ${row.total_amount} MAD`);
    }
    console.log(`✅ Migrated ${ordersCount} orders\n`);

    // Cleanup
    pgClient.release();
    await pool.end();

    console.log('════════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('════════════════════════════════════════');
    console.log(`📋 Menu items: ${menuCount}`);
    console.log(`👥 Users: ${usersCount}`);
    console.log(`🛒 Orders: ${ordersCount}`);
    console.log('════════════════════════════════════════\n');
    console.log('🚀 You can now use the app with Firestore!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
