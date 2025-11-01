const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkSuperAdmin() {
  try {
    console.log('🔍 Checking for super admin accounts...\n');

    const usersSnapshot = await db.collection('users')
      .where('isSuperAdmin', '==', true)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ No super admin accounts found.\n');
      console.log('📝 To create a super admin account, you need to:');
      console.log('   1. Create a user via the web interface or Cloud Function');
      console.log('   2. Manually update the user document in Firestore:');
      console.log('      - Set isSuperAdmin: true');
      console.log('      - Update the Firebase Auth custom claims\n');
    } else {
      console.log('✅ Found super admin account(s):\n');
      usersSnapshot.forEach(doc => {
        const user = doc.data();
        console.log(`   📧 Username: ${user.username}`);
        console.log(`   👤 Name: ${user.name}`);
        console.log(`   🏪 Restaurant: ${user.restaurantId || 'N/A'}`);
        console.log(`   🆔 User ID: ${doc.id}`);
        console.log(`   ✨ Super Admin: ${user.isSuperAdmin}\n`);
      });
      console.log('🔐 Login credentials:');
      console.log('   Use the username and password you set when creating the account');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSuperAdmin();
