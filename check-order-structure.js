/**
 * Check Order Structure
 * Compare web app order structure with Android expectations
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkOrderStructure() {
  console.log('\n📊 Checking order structure from web app...\n');

  try {
    // Get one sample order
    const ordersSnapshot = await db.collection('orders').limit(1).get();

    if (ordersSnapshot.empty) {
      console.log('❌ No orders found in database');
      return;
    }

    const orderDoc = ordersSnapshot.docs[0];
    const orderData = orderDoc.data();

    console.log('✅ Sample Order Found:');
    console.log(`   ID: ${orderDoc.id}`);
    console.log(`   Order Number: ${orderData.orderNumber}`);
    console.log(`   User ID: ${orderData.userId}`);
    console.log(`   Status: ${orderData.status}`);
    console.log(`   Total: ${orderData.totalAmount} MAD`);
    console.log(`   Items: ${orderData.items?.length || 0}`);
    console.log('');

    console.log('📝 Full Order Structure:');
    console.log(JSON.stringify(orderData, null, 2));
    console.log('');

    console.log('🔍 Required fields for Android:');
    const requiredFields = [
      'orderNumber',
      'userId',
      'items',
      'totalAmount',
      'status',
      'paymentStatus',
      'createdAt',
      'updatedAt'
    ];

    requiredFields.forEach(field => {
      const exists = orderData.hasOwnProperty(field);
      const value = orderData[field];
      console.log(`   ${exists ? '✅' : '❌'} ${field}: ${value !== undefined ? typeof value : 'missing'}`);
    });

    console.log('');

    if (orderData.items && orderData.items.length > 0) {
      console.log('📦 First Item Structure:');
      console.log(JSON.stringify(orderData.items[0], null, 2));
      console.log('');

      console.log('🔍 Required item fields for Android:');
      const requiredItemFields = ['menuItemId', 'name', 'price', 'quantity'];
      requiredItemFields.forEach(field => {
        const exists = orderData.items[0].hasOwnProperty(field);
        const value = orderData.items[0][field];
        console.log(`   ${exists ? '✅' : '❌'} ${field}: ${value !== undefined ? typeof value : 'missing'}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

checkOrderStructure();
