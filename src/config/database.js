const { Pool } = require('pg');
require('dotenv').config();

// Alternative: Use connection string if available
let connectionConfig;

if (process.env.DATABASE_URL) {
  console.log('🔗 Using DATABASE_URL connection string');
  connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase') ? {
      rejectUnauthorized: false
    } : false
  };
} else {
  console.log('🔗 Using individual database environment variables');
  console.log('🔗 Database Connection Config:');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`SSL enabled: ${process.env.DB_HOST?.includes('supabase.co') ? 'Yes' : 'No'}`);

  connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'finance_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,                        // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,       // Close idle clients after 30 seconds
    connectionTimeoutMillis: 20000, // 20s timeout for cloud deployment
    keepAlive: true,                // Keep connection alive to prevent idle drops
    // Enhanced SSL configuration for Supabase
    ssl: process.env.DB_HOST?.includes('supabase.co') ? {
      rejectUnauthorized: false,
      ca: false,
      checkServerIdentity: false,
      secureProtocol: 'TLSv1_2_method'
    } : false,
    // Add IPv4 preference for better compatibility
    family: 4,
  };
}

const pool = new Pool(connectionConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('✗ Unexpected database error:', err);
  process.exit(-1);
});

// Query helper function with logging
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', {
        text,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
};
