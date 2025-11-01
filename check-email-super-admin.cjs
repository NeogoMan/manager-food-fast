const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function checkEmailSuperAdmin() {
  try {
    console.log('🔍 Checking for Firebase Auth email-based super admin accounts...\n');

    // List all users
    const listUsersResult = await auth.listUsers();

    if (listUsersResult.users.length === 0) {
      console.log('❌ No Firebase Auth users found.\n');
      console.log('To create an email-based super admin:');
      console.log('  Run: node create-email-super-admin.cjs your@email.com YourPassword123\n');
      process.exit(0);
    }

    console.log(`Found ${listUsersResult.users.length} Firebase Auth user(s):\n`);

    for (const user of listUsersResult.users) {
      const isSuperAdmin = user.customClaims?.isSuperAdmin === true;

      console.log(`📧 Email: ${user.email || 'N/A'}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Display Name: ${user.displayName || 'N/A'}`);
      console.log(`   Super Admin: ${isSuperAdmin ? '✅ YES' : '❌ NO'}`);

      if (isSuperAdmin) {
        console.log(`   🔑 Login at: https://fast-food-manager-b1f54.web.app`);
        console.log(`   📝 Use this email and password to login`);
      }
      console.log('');
    }

    const superAdmins = listUsersResult.users.filter(u => u.customClaims?.isSuperAdmin === true);

    if (superAdmins.length === 0) {
      console.log('⚠️  No super admin found!');
      console.log('   To make a user super admin:');
      console.log('   node set-email-super-admin.cjs user@email.com\n');
    } else {
      console.log(`✅ Found ${superAdmins.length} super admin account(s)`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEmailSuperAdmin();
