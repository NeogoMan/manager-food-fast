import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run database migrations
 * This script updates the database schema to support user authentication
 */
async function runMigrations() {
  const dbPath = process.env.DATABASE_PATH || join(__dirname, 'restaurant.db');
  console.log(`\n🔄 Running database migrations...`);
  console.log(`📁 Database path: ${dbPath}\n`);

  const db = new Database(dbPath);

  try {
    // Check if users table already exists
    const usersTableExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
      .get();

    if (usersTableExists) {
      console.log('✅ Users table already exists, skipping creation...');
    } else {
      console.log('📝 Creating users table...');

      // Read and execute migration SQL
      const migrationSQL = readFileSync(join(__dirname, 'migration-users.sql'), 'utf8');
      db.exec(migrationSQL);

      console.log('✅ Users table created successfully');
    }

    // Check if orders table has user_id column
    const ordersInfo = db.prepare("PRAGMA table_info(orders)").all();
    const hasUserId = ordersInfo.some(col => col.name === 'user_id');

    if (hasUserId) {
      console.log('✅ Orders table already has user_id column');
    } else {
      console.log('📝 Adding user_id column to orders table...');

      // SQLite doesn't support adding foreign keys to existing tables easily
      // We'll add a simple column without the foreign key constraint
      db.exec(`
        ALTER TABLE orders ADD COLUMN user_id INTEGER;
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      `);

      console.log('✅ user_id column added to orders table');
    }

    // Check if orders table has approval columns
    const hasApprovedBy = ordersInfo.some(col => col.name === 'approved_by');

    if (hasApprovedBy) {
      console.log('✅ Orders table already has approval columns');
    } else {
      console.log('📝 Adding approval columns to orders table...');

      // Read and execute approval migration SQL
      const approvalMigrationSQL = readFileSync(join(__dirname, 'migration-order-approval.sql'), 'utf8');
      db.exec(approvalMigrationSQL);

      console.log('✅ Approval columns added to orders table');
    }

    // Create default admin/manager account if no users exist
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();

    if (userCount.count === 0) {
      console.log('📝 Creating default manager account...');

      // Hash the default password
      const defaultPassword = 'Admin123!'; // User should change this on first login
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      const result = db.prepare(`
        INSERT INTO users (username, password_hash, role, name, phone, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('admin', passwordHash, 'manager', 'Administrateur', null, 'active');

      console.log('✅ Default manager account created');
      console.log('\n⚠️  DEFAULT CREDENTIALS (CHANGE IMMEDIATELY):');
      console.log('   Username: admin');
      console.log('   Password: Admin123!\n');
    } else {
      console.log('✅ Users already exist, skipping default account creation');
    }

    console.log('\n✨ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run migrations if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runMigrations };
