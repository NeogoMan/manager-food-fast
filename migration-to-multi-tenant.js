/**
 * Data Migration Script: Single-Tenant to Multi-Tenant
 *
 * This script migrates existing restaurant data to a multi-tenant structure by:
 * 1. Creating a default restaurant document
 * 2. Adding restaurantId to all existing users
 * 3. Adding restaurantId to all existing orders
 * 4. Adding restaurantId to all existing menu items
 * 5. Adding restaurantId to all existing notifications
 * 6. Adding restaurantId to all existing carts
 *
 * IMPORTANT:
 * - Backup your Firestore database before running this script
 * - Run this script only once
 * - Test on a development/staging environment first
 */

import admin from "firebase-admin";
import {readFileSync} from "fs";

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(
    readFileSync("./serviceAccountKey.json", "utf8"),
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Configuration
const DEFAULT_RESTAURANT_ID = "rest_default_001";
const DEFAULT_RESTAURANT_NAME = "Fast Food Manager"; // Your restaurant name
const BATCH_SIZE = 500; // Firestore batch write limit

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Create default restaurant document
 */
async function createDefaultRestaurant() {
  console.log("\n📝 Step 1: Creating default restaurant...");

  const restaurantRef = db.collection("restaurants").doc(DEFAULT_RESTAURANT_ID);
  const restaurantDoc = await restaurantRef.get();

  if (restaurantDoc.exists) {
    console.log("✅ Default restaurant already exists. Skipping creation.");
    return DEFAULT_RESTAURANT_ID;
  }

  const restaurantData = {
    restaurantId: DEFAULT_RESTAURANT_ID,
    name: DEFAULT_RESTAURANT_NAME,
    email: "admin@fastfoodmanager.com",
    phone: "+212-600-000-000",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    timezone: "UTC",
    currency: "USD",

    // Start with basic plan
    plan: "basic",
    status: "active",
    billing: {
      stripeCustomerId: null,
      subscriptionId: null,
      currentPeriodStart: admin.firestore.Timestamp.now(),
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
    },

    // Feature flags (basic plan)
    features: {
      analyticsEnabled: false,
      mobileAppEnabled: false,
      multiLocationEnabled: false,
      customBrandingEnabled: false,
      apiAccessEnabled: false,
      prioritySupportEnabled: false,
      maxStaffUsers: 3,
      maxOrders: -1, // unlimited
    },

    // Default branding
    branding: {
      logoUrl: null,
      primaryColor: "#FF5722",
      secondaryColor: "#FFC107",
      accentColor: "#4CAF50",
      customDomain: null,
    },

    // Usage stats
    usage: {
      totalOrders: 0,
      totalRevenue: 0,
      activeStaffUsers: 0,
      storageUsedMB: 0,
      lastActivityAt: admin.firestore.Timestamp.now(),
    },

    // Metadata
    createdAt: admin.firestore.Timestamp.now(),
    createdBy: "migration_script",
    updatedAt: admin.firestore.Timestamp.now(),
    updatedBy: "migration_script",

    // Onboarding
    onboardingCompleted: true,
    setupStep: "completed",
  };

  await restaurantRef.set(restaurantData);
  console.log(`✅ Created default restaurant: ${DEFAULT_RESTAURANT_ID}`);

  return DEFAULT_RESTAURANT_ID;
}

/**
 * Add restaurantId to all documents in a collection
 */
async function migrateCollection(collectionName, restaurantId) {
  console.log(`\n📝 Migrating collection: ${collectionName}...`);

  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`✅ Collection ${collectionName} is empty. Skipping.`);
    return 0;
  }

  const totalDocs = snapshot.size;
  console.log(`Found ${totalDocs} documents to migrate.`);

  let migratedCount = 0;
  let skippedCount = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Skip if already has restaurantId
    if (data.restaurantId) {
      skippedCount++;
      continue;
    }

    // Add restaurantId to document
    batch.update(doc.ref, {
      restaurantId: restaurantId,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    batchCount++;
    migratedCount++;

    // Commit batch when it reaches limit
    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`  Committed batch of ${batchCount} documents...`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  // Commit remaining documents
  if (batchCount > 0) {
    await batch.commit();
    console.log(`  Committed final batch of ${batchCount} documents.`);
  }

  console.log(`✅ Migrated ${migratedCount} documents in ${collectionName}`);
  if (skippedCount > 0) {
    console.log(`   (Skipped ${skippedCount} documents that already had restaurantId)`);
  }

  return migratedCount;
}

/**
 * Update first manager user to be super admin (optional)
 */
async function createSuperAdminUser() {
  console.log("\n📝 Step 7: Setting up super admin user...");

  const usersRef = db.collection("users");
  const managersSnapshot = await usersRef.where("role", "==", "manager").limit(1).get();

  if (managersSnapshot.empty) {
    console.log("⚠️  No manager users found. Skipping super admin setup.");
    console.log("   You can manually add isSuperAdmin: true to a user later.");
    return;
  }

  const firstManager = managersSnapshot.docs[0];
  const managerData = firstManager.data();

  console.log(`Found manager: ${managerData.username} (${firstManager.id})`);
  console.log("Do you want to make this user a super admin? (This is optional)");
  console.log("Super admins can manage all restaurants in the platform.");

  // For now, we'll skip this - the user can manually set it later
  console.log("⏭️  Skipping super admin setup. You can manually add 'isSuperAdmin: true' later.");
}

/**
 * Generate migration summary
 */
async function generateSummary(stats) {
  console.log("\n");
  console.log("=".repeat(60));
  console.log(" MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Restaurant ID:     ${DEFAULT_RESTAURANT_ID}`);
  console.log(`Restaurant Name:   ${DEFAULT_RESTAURANT_NAME}`);
  console.log(`Users migrated:    ${stats.users}`);
  console.log(`Orders migrated:   ${stats.orders}`);
  console.log(`Menu items (menu): ${stats.menu}`);
  console.log(`Menu items (menu_items): ${stats.menu_items}`);
  console.log(`Notifications:     ${stats.notifications}`);
  console.log(`Carts:             ${stats.carts}`);
  console.log("=".repeat(60));
  console.log("\n✅ Migration completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Deploy updated Cloud Functions: firebase deploy --only functions");
  console.log("2. Deploy updated Firestore rules: firebase deploy --only firestore:rules");
  console.log("3. Deploy updated Firestore indexes: firebase deploy --only firestore:indexes");
  console.log("4. Test the application thoroughly");
  console.log("5. Update frontend/Android code to use restaurantId");
}

// ============================================================================
// MAIN MIGRATION FLOW
// ============================================================================

async function runMigration() {
  console.log("🚀 Starting Multi-Tenant Migration");
  console.log("==================================\n");
  console.log("⚠️  IMPORTANT: Make sure you have backed up your Firestore database!");
  console.log("This script will modify existing data.\n");

  try {
    // Step 1: Create default restaurant
    const restaurantId = await createDefaultRestaurant();

    // Step 2: Migrate users
    const usersCount = await migrateCollection("users", restaurantId);

    // Step 3: Migrate orders
    const ordersCount = await migrateCollection("orders", restaurantId);

    // Step 4: Migrate menu collection
    const menuCount = await migrateCollection("menu", restaurantId);

    // Step 5: Migrate menu_items collection
    const menuItemsCount = await migrateCollection("menu_items", restaurantId);

    // Step 6: Migrate notifications
    const notificationsCount = await migrateCollection("notifications", restaurantId);

    // Step 7: Migrate carts
    const cartsCount = await migrateCollection("carts", restaurantId);

    // Step 8: Optional super admin setup
    await createSuperAdminUser();

    // Generate summary
    await generateSummary({
      users: usersCount,
      orders: ordersCount,
      menu: menuCount,
      menu_items: menuItemsCount,
      notifications: notificationsCount,
      carts: cartsCount,
    });

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed with error:");
    console.error(error);
    process.exit(1);
  }
}

// Run migration
runMigration();
