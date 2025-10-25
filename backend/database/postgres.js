import pkg from 'pg';
const { Pool, types } = pkg;
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configure pg to parse DECIMAL/NUMERIC types as floats instead of strings
 * This ensures price values are returned as numbers from the API
 */
types.setTypeParser(1700, function(val) {
  return parseFloat(val);
});

/**
 * PostgreSQL connection pool configuration
 * Uses environment variables for credentials
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'restaurant_db',
  user: process.env.DB_USER || 'restaurant_user',
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_MAX || '20'), // maximum number of clients
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '2000'),
});

/**
 * Test database connection
 */
pool.on('connect', () => {
  console.log('✅ PostgreSQL client connected to pool');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

/**
 * Helper function to execute a single query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise} PostgreSQL client
 */
export async function getClient() {
  return await pool.connect();
}

/**
 * Test the database connection
 */
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as now, current_database() as database, current_user as user');
    console.log('✅ PostgreSQL connection test successful');
    console.log(`   Database: ${result.rows[0].database}`);
    console.log(`   User: ${result.rows[0].user}`);
    console.log(`   Time: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection test failed:', error.message);
    return false;
  }
}

/**
 * Close all connections in the pool
 * Call this when shutting down the application
 */
export async function closePool() {
  await pool.end();
  console.log('👋 PostgreSQL connection pool closed');
}

export default pool;
