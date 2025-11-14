const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function fixAdminUser() {
  console.log('🔧 Starting fix for "admin" user...\n');

  try {
    // Step 1: Find the admin user in Firestore
    console.log('📋 Step 1: Searching for "admin" user in Firestore...');
    const usersSnapshot = await db.collection('users')
      .where('username', '==', 'admin')
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error('❌ Error: No user found with username "admin"');
      console.log('   Please verify the username exists in Firestore.');
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const currentData = userDoc.data();

    console.log('✅ Found user:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Username: ${currentData.username}`);
    console.log(`   Current Role: ${currentData.role}`);
    console.log(`   Current isSuperAdmin: ${currentData.isSuperAdmin}`);
    console.log(`   Current restaurantId: ${currentData.restaurantId || 'null'}\n`);

    // Step 2: Verify the default restaurant exists
    console.log('📋 Step 2: Verifying default restaurant exists...');
    const restaurantDoc = await db.collection('restaurants').doc('rest_default_001').get();

    if (!restaurantDoc.exists) {
      console.error('❌ Error: Restaurant "rest_default_001" does not exist');
      console.log('   Available options:');
      console.log('   1. Create the default restaurant first');
      console.log('   2. Specify a different restaurant ID');
      process.exit(1);
    }

    const restaurantData = restaurantDoc.data();
    console.log('✅ Found restaurant:');
    console.log(`   Restaurant ID: rest_default_001`);
    console.log(`   Name: ${restaurantData.name}`);
    console.log(`   Email: ${restaurantData.email}\n`);

    // Step 3: Update Firestore user document
    console.log('📋 Step 3: Updating Firestore user document...');
    const updates = {
      isSuperAdmin: false,
      restaurantId: 'rest_default_001',
      role: 'manager',
      updatedAt: new Date()
    };

    await db.collection('users').doc(userId).update(updates);
    console.log('✅ Firestore document updated successfully\n');

    // Step 4: Update Firebase Auth custom claims
    console.log('📋 Step 4: Updating Firebase Auth custom claims...');
    const customClaims = {
      role: 'manager',
      username: 'admin',
      restaurantId: 'rest_default_001',
      isSuperAdmin: false,
      name: currentData.name || 'Administrator',
      phone: currentData.phone || null
    };

    await auth.setCustomUserClaims(userId, customClaims);
    console.log('✅ Custom claims updated successfully\n');

    // Step 5: Verify the changes
    console.log('📋 Step 5: Verifying changes...');
    const updatedDoc = await db.collection('users').doc(userId).get();
    const updatedData = updatedDoc.data();
    const userRecord = await auth.getUser(userId);

    console.log('✅ Verification complete:');
    console.log('\n📊 Updated Firestore Document:');
    console.log(`   Username: ${updatedData.username}`);
    console.log(`   Role: ${updatedData.role}`);
    console.log(`   isSuperAdmin: ${updatedData.isSuperAdmin}`);
    console.log(`   restaurantId: ${updatedData.restaurantId}`);

    console.log('\n🎫 Updated Auth Custom Claims:');
    console.log(`   Role: ${userRecord.customClaims.role}`);
    console.log(`   isSuperAdmin: ${userRecord.customClaims.isSuperAdmin}`);
    console.log(`   restaurantId: ${userRecord.customClaims.restaurantId}`);

    console.log('\n✅ SUCCESS! The "admin" user has been updated:');
    console.log('   - isSuperAdmin changed from true → false');
    console.log('   - restaurantId set to: rest_default_001');
    console.log('   - Role: manager');
    console.log('\n📝 Next Steps:');
    console.log('   1. Clear browser cache/cookies');
    console.log('   2. Login with: admin / Admin123!');
    console.log('   3. Verify redirect to "/" (Orders page)');
    console.log('   4. Confirm NO access to "/admin/restaurants"\n');

  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixAdminUser();
