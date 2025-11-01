const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createSuperAdminUser() {
  try {
    const username = 'superadmin';
    const password = 'Admin2024!';
    const email = 'admin@fastfood.com';

    console.log('🔍 Checking if super admin user exists...');

    // Check if user already exists
    const existingUsers = await db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!existingUsers.empty) {
      console.log('✅ Super admin user already exists in Firestore');
      const userData = existingUsers.docs[0].data();
      console.log('User ID:', existingUsers.docs[0].id);
      console.log('Username:', userData.username);
      console.log('Email:', userData.email);
      console.log('Is Super Admin:', userData.isSuperAdmin);
      return;
    }

    console.log('📝 Creating super admin user...');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get the Firebase Auth user by email
    let authUser;
    try {
      authUser = await auth.getUserByEmail(email);
      console.log('✅ Found existing Firebase Auth user:', authUser.uid);
    } catch (error) {
      console.log('📝 Creating Firebase Auth user...');
      authUser = await auth.createUser({
        email: email,
        password: password,
        emailVerified: true,
        displayName: 'Super Administrator'
      });
      console.log('✅ Firebase Auth user created:', authUser.uid);
    }

    // Set custom claims
    await auth.setCustomUserClaims(authUser.uid, {
      role: 'superadmin',
      isSuperAdmin: true,
      username: username
    });
    console.log('✅ Custom claims set');

    // Create Firestore user document
    await db.collection('users').doc(authUser.uid).set({
      username: username,
      passwordHash: passwordHash,
      role: 'superadmin',
      name: 'Super Administrator',
      email: email,
      phone: null,
      restaurantId: null,
      isSuperAdmin: true,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: authUser.uid
    });

    console.log('✅ Super admin user created successfully!');
    console.log('');
    console.log('===========================================');
    console.log('Login Credentials:');
    console.log('===========================================');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('Email:', email);
    console.log('===========================================');
    console.log('');
    console.log('You can now login at:');
    console.log('https://fast-food-manager-b1f54.web.app/login');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    process.exit(0);
  }
}

createSuperAdminUser();
