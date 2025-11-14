const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateSuperAdmins() {
  console.log('🚀 Starting Super Admin Migration...\n');

  try {
    // Step 1: Find all super admin users
    console.log('📋 Step 1: Finding super admin users...');
    const usersSnapshot = await db.collection('users')
      .where('isSuperAdmin', '==', true)
      .get();

    if (usersSnapshot.empty) {
      console.log('ℹ️  No super admin users found to migrate.');
      console.log('   This is normal if migration has already been completed.\n');
      process.exit(0);
    }

    console.log(`✅ Found ${usersSnapshot.size} super admin user(s) to migrate:\n`);

    const migrations = [];
    const superAdmins = [];

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      superAdmins.push({
        id: doc.id,
        username: data.username || 'unknown',
        name: data.name || 'Unknown',
        email: data.email || null
      });
      console.log(`   - ${data.username || 'unknown'} (${data.name || 'Unknown'}) [ID: ${doc.id}]`);
    });

    console.log('');

    // Step 2: Backup current data
    console.log('📋 Step 2: Creating backup...');
    const backupData = {
      timestamp: new Date().toISOString(),
      superAdmins: superAdmins.map(sa => ({
        ...sa,
        originalCollection: 'users'
      }))
    };

    await db.collection('_migrations').doc('super_admin_migration').set({
      ...backupData,
      status: 'in_progress',
      startedAt: new Date()
    });

    console.log('✅ Backup created in _migrations/super_admin_migration\n');

    // Step 3: Migrate each super admin
    console.log('📋 Step 3: Migrating super admins to new collection...');

    for (const doc of usersSnapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();

      try {
        // Copy to super_admins collection with same ID
        await db.collection('super_admins').doc(userId).set({
          username: userData.username || `admin_${userId.substring(0, 8)}`,
          passwordHash: userData.passwordHash,
          name: userData.name || 'Super Administrator',
          email: userData.email || null,
          phone: userData.phone || null,
          role: 'superAdmin',
          isSuperAdmin: true,
          status: userData.status || 'active',
          createdAt: userData.createdAt || new Date(),
          updatedAt: new Date(),
          migratedAt: new Date(),
          migratedFrom: 'users',
          lastLoginAt: userData.lastLoginAt || null,
          loginAttempts: 0
        });

        migrations.push({
          userId,
          username: userData.username || `admin_${userId.substring(0, 8)}`,
          status: 'migrated'
        });

        console.log(`   ✅ Migrated: ${userData.username} → super_admins/${userId}`);

      } catch (error) {
        console.error(`   ❌ Failed to migrate ${userData.username}:`, error.message);
        migrations.push({
          userId,
          username: userData.username,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log('');

    // Step 4: Verify migration
    console.log('📋 Step 4: Verifying migration...');

    let verified = 0;
    let failed = 0;

    for (const migration of migrations) {
      if (migration.status === 'migrated') {
        const newDoc = await db.collection('super_admins').doc(migration.userId).get();
        if (newDoc.exists) {
          verified++;
          console.log(`   ✅ Verified: ${migration.username}`);
        } else {
          failed++;
          console.error(`   ❌ Verification failed: ${migration.username}`);
        }
      }
    }

    console.log(`\n   Total: ${verified} verified, ${failed} failed\n`);

    if (failed > 0) {
      console.error('❌ Migration verification failed for some users.');
      console.error('   Please check the errors above and retry.\n');
      process.exit(1);
    }

    // Step 5: Delete from users collection
    console.log('📋 Step 5: Removing super admins from users collection...');

    const batch = db.batch();
    let deleteCount = 0;

    for (const migration of migrations) {
      if (migration.status === 'migrated') {
        const userRef = db.collection('users').doc(migration.userId);
        batch.delete(userRef);
        deleteCount++;
      }
    }

    await batch.commit();
    console.log(`✅ Deleted ${deleteCount} user(s) from users collection\n`);

    // Step 6: Update migration record
    await db.collection('_migrations').doc('super_admin_migration').update({
      status: 'completed',
      completedAt: new Date(),
      migrations,
      summary: {
        total: migrations.length,
        successful: verified,
        failed: failed
      }
    });

    // Step 7: Display summary
    console.log('═══════════════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════');
    console.log(`\n📊 Summary:`);
    console.log(`   - Super admins migrated: ${verified}`);
    console.log(`   - Failed migrations: ${failed}`);
    console.log(`   - Users collection cleaned: ${deleteCount} removed`);
    console.log(`\n📁 Collections:`);
    console.log(`   - super_admins: ${verified} document(s)`);
    console.log(`   - users: Regular restaurant users only`);
    console.log(`\n🔐 Authentication:`);
    console.log(`   - Super admins must now use /platform-admin login`);
    console.log(`   - Restaurant users continue using /login`);
    console.log(`\n📝 Next Steps:`);
    console.log(`   1. Deploy Cloud Functions with authenticateSuperAdmin`);
    console.log(`   2. Update frontend with PlatformAdminLogin component`);
    console.log(`   3. Test authentication on /platform-admin`);
    console.log(`   4. Update Firestore security rules\n`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);

    // Update migration record with error
    await db.collection('_migrations').doc('super_admin_migration').update({
      status: 'failed',
      failedAt: new Date(),
      error: error.message,
      stack: error.stack
    });

    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateSuperAdmins();
