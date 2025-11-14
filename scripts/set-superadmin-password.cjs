const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// ============================================================================
// CONFIGURATION - CHANGE THESE VALUES
// ============================================================================
const USERNAME = 'superadmin';  // Which super admin to update
const NEW_PASSWORD = 'SuperAdmin2024!@';  // New password (must meet requirements)

// ============================================================================

async function setSuperAdminPassword() {
  console.log('🔐 Super Admin Password Reset Tool\n');

  try {
    // Validate password requirements
    console.log('📋 Validating password requirements...');

    if (NEW_PASSWORD.length < 12) {
      throw new Error('Password must be at least 12 characters long');
    }
    if (!/[A-Z]/.test(NEW_PASSWORD)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(NEW_PASSWORD)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(NEW_PASSWORD)) {
      throw new Error('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(NEW_PASSWORD)) {
      throw new Error('Password must contain at least one special character');
    }

    console.log('✅ Password meets all requirements\n');

    // Find the super admin
    console.log(`📋 Finding super admin: ${USERNAME}...`);
    const superAdminsSnapshot = await db.collection('super_admins')
      .where('username', '==', USERNAME)
      .limit(1)
      .get();

    if (superAdminsSnapshot.empty) {
      throw new Error(`Super admin with username "${USERNAME}" not found`);
    }

    const adminDoc = superAdminsSnapshot.docs[0];
    const adminData = adminDoc.data();
    const adminId = adminDoc.id;

    console.log('✅ Found super admin:');
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Name: ${adminData.name}`);
    console.log(`   Email: ${adminData.email || 'N/A'}`);
    console.log(`   ID: ${adminId}\n`);

    // Hash the password
    console.log('📋 Hashing new password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, saltRounds);
    console.log('✅ Password hashed successfully\n');

    // Update Firestore
    console.log('📋 Updating password in Firestore...');
    await db.collection('super_admins').doc(adminId).update({
      passwordHash: passwordHash,
      updatedAt: new Date(),
      passwordResetAt: new Date()
    });
    console.log('✅ Firestore updated successfully\n');

    // Clear custom claims to force re-authentication
    console.log('📋 Clearing authentication tokens...');
    try {
      await auth.setCustomUserClaims(adminId, null);
      console.log('✅ Authentication tokens cleared\n');
    } catch (error) {
      console.log('⚠️  Could not clear auth tokens (user may not exist in Firebase Auth)');
      console.log('   This is okay - password will work on next login\n');
    }

    // Success summary
    console.log('═══════════════════════════════════════════════');
    console.log('✅ PASSWORD RESET SUCCESSFUL');
    console.log('═══════════════════════════════════════════════');
    console.log(`\n📊 Details:`);
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Name: ${adminData.name}`);
    console.log(`   New Password: ${NEW_PASSWORD}`);
    console.log(`\n🔐 Login Information:`);
    console.log(`   URL: https://fast-food-manager-b1f54.web.app/platform-admin`);
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Password: ${NEW_PASSWORD}`);
    console.log(`\n⚠️  IMPORTANT:`);
    console.log(`   - Save this password in a secure location`);
    console.log(`   - The password meets all security requirements`);
    console.log(`   - You can login immediately with the new password`);
    console.log(`   - Delete this script or change the password in the file after use\n`);

  } catch (error) {
    console.error('\n❌ Error resetting password:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the password reset
setSuperAdminPassword();
