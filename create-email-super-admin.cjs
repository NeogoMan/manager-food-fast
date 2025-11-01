const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();

async function createEmailSuperAdmin() {
  try {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.log('❌ Usage: node create-email-super-admin.cjs <email> <password>');
      console.log('   Example: node create-email-super-admin.cjs admin@restaurant.com SecurePass123!');
      process.exit(1);
    }

    console.log(`📧 Creating super admin account...`);
    console.log(`   Email: ${email}`);

    // Create the user
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: 'Super Administrator',
      emailVerified: true
    });

    console.log(`✅ User created with UID: ${userRecord.uid}`);

    // Set custom claims to make them super admin
    await auth.setCustomUserClaims(userRecord.uid, {
      isSuperAdmin: true,
      role: 'superadmin'
    });

    console.log(`✅ Super admin privileges granted!\n`);
    console.log('🎉 Super Admin Account Created!\n');
    console.log('🔐 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n🌐 Admin Panel: https://fast-food-manager-b1f54.web.app`);
    console.log('\n📝 This account can:');
    console.log('   ✅ Create new restaurants');
    console.log('   ✅ Manage all restaurants');
    console.log('   ✅ View all orders');
    console.log('   ✅ Manage all users');

    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.error(`❌ Error: Email ${process.argv[2]} already exists`);
      console.log('\n💡 To make this user a super admin instead, run:');
      console.log(`   node set-email-super-admin.cjs ${process.argv[2]}`);
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

createEmailSuperAdmin();
