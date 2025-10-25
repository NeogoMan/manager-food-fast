import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Create default admin/manager account
 */
async function seedAdmin() {
  const dbPath = process.env.DATABASE_PATH || join(__dirname, 'restaurant.db');
  console.log(`\n🌱 Seeding default admin account...`);

  const db = new Database(dbPath);

  try {
    // Check if any users exist
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();

    if (userCount.count > 0) {
      console.log('✅ Users already exist, skipping admin creation');
      db.close();
      return;
    }

    // Hash the default password
    const defaultPassword = 'Admin123!'; // User should change this on first login
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Create admin user
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, role, name, phone, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('admin', passwordHash, 'manager', 'Administrateur', null, 'active');

    console.log('✅ Default manager account created successfully');
    console.log('\n🔐 DEFAULT CREDENTIALS (CHANGE IMMEDIATELY ON FIRST LOGIN):');
    console.log('   Username: admin');
    console.log('   Password: Admin123!');
    console.log('   Role: Manager (Gestionnaire)\n');
    console.log('⚠️  IMPORTANT: Change this password immediately after first login!\n');

  } catch (error) {
    console.error('❌ Failed to create admin account:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run seeding if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedAdmin };
