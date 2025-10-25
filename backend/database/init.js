import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initialize the database with schema and optional seed data
 * @param {string} dbPath - Path to the SQLite database file
 * @param {boolean} shouldSeed - Whether to seed the database with sample data
 * @returns {Database} - The database instance
 */
export function initializeDatabase(dbPath, shouldSeed = false) {
  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Read and execute schema
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  console.log('✅ Database schema initialized');

  // Seed data if requested and tables are empty
  if (shouldSeed) {
    const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();

    if (menuCount.count === 0) {
      const seedPath = join(__dirname, 'seed.sql');
      const seed = readFileSync(seedPath, 'utf8');
      db.exec(seed);
      console.log('✅ Database seeded with sample data');
    } else {
      console.log('ℹ️  Database already contains data, skipping seed');
    }
  }

  return db;
}

/**
 * Get database instance (singleton pattern)
 */
let dbInstance = null;

export function getDatabase(dbPath = './database/restaurant.db', shouldSeed = true) {
  if (!dbInstance) {
    dbInstance = initializeDatabase(dbPath, shouldSeed);
  }
  return dbInstance;
}

export default { initializeDatabase, getDatabase };
