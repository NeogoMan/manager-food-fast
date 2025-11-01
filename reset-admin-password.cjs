const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function resetAdminPassword() {
  try {
    const username = process.argv[2] || 'admin';
    const newPassword = process.argv[3];

    if (!newPassword) {
      console.log('❌ Usage: node reset-admin-password.cjs <username> <new-password>');
      console.log('   Example: node reset-admin-password.cjs admin MyNewPassword123');
      process.exit(1);
    }

    console.log(`🔍 Finding user: ${username}...`);

    // Find user by username
    const usersSnapshot = await db.collection('users')
      .where('username', '==', username)
      .get();

    if (usersSnapshot.empty) {
      console.log(`❌ User '${username}' not found`);
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    console.log(`✅ Found user: ${userData.name} (${userData.username})`);
    console.log(`🔐 Hashing new password...`);

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the password
    await userDoc.ref.update({
      passwordHash: passwordHash,
      updatedAt: new Date()
    });

    console.log('✅ Password updated successfully!\n');
    console.log('🔐 New login credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${newPassword}`);
    console.log('\n🌐 Login at: https://fast-food-manager-b1f54.web.app');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
