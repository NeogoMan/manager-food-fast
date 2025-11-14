const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const path = require('path');
const readline = require('readline');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetSuperAdminPassword() {
  console.log('🔐 Super Admin Password Reset Tool\n');

  try {
    // Step 1: List all super admins
    console.log('📋 Step 1: Finding super admin accounts...');
    const superAdminsSnapshot = await db.collection('super_admins').get();

    if (superAdminsSnapshot.empty) {
      console.log('❌ No super admin accounts found.');
      console.log('   The super_admins collection is empty.\n');
      process.exit(1);
    }

    console.log(`✅ Found ${superAdminsSnapshot.size} super admin account(s):\n`);

    const superAdmins = [];
    superAdminsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      superAdmins.push({
        index: index + 1,
        id: doc.id,
        username: data.username,
        name: data.name,
        email: data.email || 'N/A'
      });
      console.log(`   ${index + 1}. Username: ${data.username}`);
      console.log(`      Name: ${data.name}`);
      console.log(`      Email: ${data.email || 'N/A'}`);
      console.log(`      ID: ${doc.id}\n`);
    });

    // Step 2: Select which super admin to reset
    let selectedIndex;
    if (superAdmins.length === 1) {
      console.log('✅ Only one super admin found. Selecting automatically.\n');
      selectedIndex = 0;
    } else {
      const answer = await question(`Select super admin to reset (1-${superAdmins.length}): `);
      selectedIndex = parseInt(answer) - 1;

      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= superAdmins.length) {
        console.log('❌ Invalid selection.');
        process.exit(1);
      }
    }

    const selectedAdmin = superAdmins[selectedIndex];
    console.log(`\n✅ Selected: ${selectedAdmin.username} (${selectedAdmin.name})\n`);

    // Step 3: Get new password
    console.log('📋 Password Requirements for Super Admin:');
    console.log('   - Minimum 12 characters');
    console.log('   - At least 1 uppercase letter');
    console.log('   - At least 1 lowercase letter');
    console.log('   - At least 1 number');
    console.log('   - At least 1 special character (!@#$%^&*(),.?":{}|<>)\n');

    const newPassword = await question('Enter new password: ');

    // Validate password
    if (newPassword.length < 12) {
      console.log('❌ Password must be at least 12 characters long.');
      process.exit(1);
    }
    if (!/[A-Z]/.test(newPassword)) {
      console.log('❌ Password must contain at least one uppercase letter.');
      process.exit(1);
    }
    if (!/[a-z]/.test(newPassword)) {
      console.log('❌ Password must contain at least one lowercase letter.');
      process.exit(1);
    }
    if (!/[0-9]/.test(newPassword)) {
      console.log('❌ Password must contain at least one number.');
      process.exit(1);
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      console.log('❌ Password must contain at least one special character.');
      process.exit(1);
    }

    const confirmPassword = await question('Confirm new password: ');

    if (newPassword !== confirmPassword) {
      console.log('❌ Passwords do not match.');
      process.exit(1);
    }

    console.log('');

    // Step 4: Hash the password
    console.log('📋 Step 2: Hashing new password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    console.log('✅ Password hashed successfully\n');

    // Step 5: Update Firestore
    console.log('📋 Step 3: Updating password in Firestore...');
    await db.collection('super_admins').doc(selectedAdmin.id).update({
      passwordHash: passwordHash,
      updatedAt: new Date(),
      passwordResetAt: new Date()
    });
    console.log('✅ Firestore updated successfully\n');

    // Step 6: Clear custom claims to force re-authentication
    console.log('📋 Step 4: Clearing authentication tokens...');
    try {
      await auth.setCustomUserClaims(selectedAdmin.id, null);
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
    console.log(`   Username: ${selectedAdmin.username}`);
    console.log(`   Name: ${selectedAdmin.name}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`\n🔐 Login Information:`);
    console.log(`   URL: https://fast-food-manager-b1f54.web.app/platform-admin`);
    console.log(`   Username: ${selectedAdmin.username}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`\n⚠️  IMPORTANT:`);
    console.log(`   - Save this password in a secure location`);
    console.log(`   - The password meets all security requirements`);
    console.log(`   - You can login immediately with the new password\n`);

  } catch (error) {
    console.error('\n❌ Error resetting password:', error);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the password reset
resetSuperAdminPassword();
