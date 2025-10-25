# Firebase Migration Script

This script migrates data from your PostgreSQL database to Firestore.

## Prerequisites

1. Firebase project created and configured
2. PostgreSQL database with existing data
3. Firebase Admin SDK service account key

## Setup

### 1. Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon (⚙️) next to "Project Overview"
4. Go to **Project Settings > Service Accounts**
5. Click **"Generate New Private Key"**
6. Save the downloaded JSON file as `serviceAccountKey.json` in this directory

⚠️ **Important:** Never commit `serviceAccountKey.json` to version control!

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

The script will automatically load environment variables from `../backend/.env`:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Make sure these are correctly configured in your backend `.env` file.

## Running the Migration

```bash
npm run migrate
```

Or:

```bash
node migrate.js
```

## What Gets Migrated

The script migrates:

1. **Users** (`users` table → `users` collection)
   - Username, password hash, role, name, phone, status
   - Preserves IDs for reference integrity

2. **Menu Items** (`menu_items` table → `menu` collection)
   - Name, description, price, category, availability
   - Image URLs

3. **Orders** (`orders` table → `orders` collection)
   - Order details, status, amounts
   - Staff assignments
   - Order items (from `order_items` table)

## Data Mapping

### PostgreSQL → Firestore

| PostgreSQL Field | Firestore Field | Type | Notes |
|-----------------|----------------|------|-------|
| `id` | Document ID | string | Converted to string |
| `created_at` | `createdAt` | Timestamp | Firestore Timestamp |
| `updated_at` | `updatedAt` | Timestamp | Firestore Timestamp |
| `password_hash` | `passwordHash` | string | Camel case |
| `is_available` | `isAvailable` | boolean | Camel case |
| `user_id` | `userId` | string | Reference as string |

## Troubleshooting

### Error: "Cannot find module './serviceAccountKey.json'"

You need to download the service account key from Firebase Console (see Setup step 1).

### Error: "Connection refused" (PostgreSQL)

Check your PostgreSQL connection details in `backend/.env`.

### Error: "Permission denied" (Firestore)

Make sure your service account has the necessary permissions:
- Cloud Datastore User
- Firebase Admin

### Error: "Batch size exceeded"

The script handles batching automatically (500 operations per batch). If you still see this error, the data might be corrupted.

## Verification

After migration, verify data in Firebase Console:

1. Go to **Firestore Database**
2. Check collections:
   - `users/` - Should contain all users
   - `menu/` - Should contain all menu items
   - `orders/` - Should contain all orders with nested items

## Rolling Back

To clear Firestore and start over:

1. In Firebase Console, go to **Firestore Database**
2. Delete collections manually:
   - Select `users` → Delete collection
   - Select `menu` → Delete collection
   - Select `orders` → Delete collection
3. Re-run the migration script

**Note:** There's no automated rollback. Be careful!

## Post-Migration

After successful migration:

1. ✅ Verify data in Firestore
2. ✅ Test authentication with migrated users
3. ✅ Update frontend to use Firestore
4. ✅ Test all features
5. ✅ Keep PostgreSQL as backup for a while

## Security

- **Never commit** `serviceAccountKey.json`
- Add it to `.gitignore`
- Rotate service account keys periodically
- Delete old keys after migration

## Support

If you encounter issues:
1. Check Firebase Console for error logs
2. Check PostgreSQL logs
3. Verify `.env` configuration
4. Ensure service account has proper permissions

---

Good luck with your migration! 🚀
