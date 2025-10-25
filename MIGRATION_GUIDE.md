# Multi-Tenant Migration Guide

This guide explains how to migrate your existing single-restaurant application to a multi-tenant SaaS platform.

## Prerequisites

- Node.js 18+ installed
- Firebase Admin SDK credentials (serviceAccountKey.json)
- Backup of your Firestore database
- Access to Firebase Console

## Migration Steps

### Step 1: Backup Your Data

**CRITICAL: Create a backup before running any migration!**

1. Go to Firebase Console > Firestore Database
2. Export your data:
   - Click on "Import/Export" tab
   - Click "Export"
   - Select all collections
   - Choose Cloud Storage bucket
   - Click "Export"

Alternatively, use the Firebase CLI:
```bash
firebase firestore:export gs://your-project-id.appspot.com/backups/$(date +%Y%m%d)
```

### Step 2: Review Configuration

Edit `migration-to-multi-tenant.js` and update:

```javascript
const DEFAULT_RESTAURANT_NAME = "My Restaurant"; // Change to your restaurant name
```

Also update the restaurant email and phone in the script:
```javascript
email: "admin@example.com", // Line 65
phone: "+1234567890",        // Line 66
```

### Step 3: Run Migration Script

```bash
# Make sure you're in the project root directory
cd /Users/elmehdimotaqi/Documents/Fasr\ food\ project

# Install dependencies if needed
npm install firebase-admin

# Run the migration
node migration-to-multi-tenant.js
```

### Step 4: Verify Migration

After migration completes, verify in Firebase Console:

1. **Check restaurants collection**:
   - Should have 1 document: `rest_default_001`
   - Verify all fields are populated correctly

2. **Check users collection**:
   - All documents should have `restaurantId: "rest_default_001"`
   - Verify `isSuperAdmin: false` on all users

3. **Check orders collection**:
   - All documents should have `restaurantId: "rest_default_001"`

4. **Check menu/menu_items collection**:
   - All documents should have `restaurantId: "rest_default_001"`

5. **Check notifications collection**:
   - All documents should have `restaurantId: "rest_default_001"`

### Step 5: Deploy Updated Firebase Configuration

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy Cloud Functions
firebase deploy --only functions
```

Wait for all deployments to complete successfully.

### Step 6: Test the Application

1. **Test Authentication**:
   ```bash
   # Try logging in with existing credentials
   # User should have restaurantId in their token
   ```

2. **Test Data Access**:
   - Verify menu items are visible
   - Create a new order
   - Check that order has restaurantId

3. **Test User Creation**:
   - Create a new user as manager
   - Verify new user has correct restaurantId

### Step 7: Update Frontend Code

The frontend needs to handle restaurantId in the auth context. This will be done in subsequent steps.

## Migration Script Details

The script performs these operations:

1. **Creates default restaurant** (`restaurants/rest_default_001`)
   - Sets up basic plan
   - Initializes feature flags
   - Creates default branding

2. **Updates users collection**
   - Adds `restaurantId` to all users
   - Sets `isSuperAdmin: false`

3. **Updates orders collection**
   - Adds `restaurantId` to all orders

4. **Updates menu/menu_items collection**
   - Adds `restaurantId` to all menu items

5. **Updates notifications collection**
   - Adds `restaurantId` to all notifications

6. **Updates carts collection**
   - Adds `restaurantId` to all carts

## Rollback Procedure

If something goes wrong:

1. **Stop immediately** - Don't make more changes

2. **Restore from backup**:
   ```bash
   firebase firestore:import gs://your-project-id.appspot.com/backups/YYYYMMDD
   ```

3. **Revert code changes**:
   ```bash
   git checkout main
   firebase deploy --only firestore:rules,firestore:indexes,functions
   ```

## Common Issues

### Issue: "Permission denied" when running migration
**Solution**: Make sure `serviceAccountKey.json` is in the project root and has correct permissions.

### Issue: Migration script times out
**Solution**: The script uses batches of 500 documents. For very large datasets, you may need to run collection migrations separately.

### Issue: Users can't log in after migration
**Solution**: Clear browser cache and localStorage. The auth token structure has changed.

### Issue: "restaurantId is null" errors
**Solution**: Make sure migration completed for all collections. Check Firebase Console.

## Post-Migration Checklist

- [ ] All collections have restaurantId field
- [ ] Default restaurant document exists
- [ ] Firestore rules deployed successfully
- [ ] Firestore indexes deployed successfully
- [ ] Cloud Functions deployed successfully
- [ ] Users can log in successfully
- [ ] Orders can be created
- [ ] Menu items are visible
- [ ] Kitchen display works
- [ ] Push notifications work

## Next Steps

After successful migration:

1. **Create additional restaurants** (if needed)
2. **Implement restaurant onboarding UI**
3. **Add subscription billing** (Stripe integration)
4. **Implement feature gating** based on plans
5. **Create super admin dashboard**
6. **Update mobile app** with restaurant context

## Support

If you encounter issues during migration:

1. Check Firebase Console logs
2. Check Cloud Functions logs: `firebase functions:log`
3. Review Firestore security rules errors
4. Consult `TECHNICAL_CHALLENGES.md` for known issues

## Timeline

Expected migration time based on data size:

- Small (< 1000 documents): 1-2 minutes
- Medium (1000-10000 documents): 5-10 minutes
- Large (10000+ documents): 15-30 minutes

The script provides progress updates as it runs.
