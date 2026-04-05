/**
 * Database initialization script
 * Runs the init.sql file to create tables and setup schema
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false,
});

async function initDatabase() {
  console.log('🚀 Starting database initialization...\n');

  try {
    // Test connection
    console.log('1️⃣ Testing database connection...');
    const testResult = await pool.query('SELECT NOW()');
    console.log('✓ Connected to database successfully');
    console.log(`   Server time: ${testResult.rows[0].now}\n`);

    // Read SQL file
    console.log('2️⃣ Reading schema file...');
    const sqlFilePath = path.join(__dirname, '..', 'db', 'init.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✓ Schema file loaded\n');

    // Execute SQL
    console.log('3️⃣ Creating database schema...');
    await pool.query(sql);
    console.log('✓ Tables created successfully\n');

    // Verify tables
    console.log('4️⃣ Verifying tables...');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('✓ Database tables:');
    tablesResult.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n✅ Database initialization completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Database initialization failed!');
    console.error('Error:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run initialization
initDatabase();
