#!/usr/bin/env node
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

async function initializeDatabase() {
  console.log('🗄️  Initializing database...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'src', 'db', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📄 Reading init.sql...');
    console.log('🔌 Connecting to database...');

    // Execute the SQL
    await pool.query(sql);

    console.log('✅ Database schema created successfully!\n');
    console.log('Tables created:');
    console.log('  - users');
    console.log('  - financial_records');
    console.log('  - Indexes created');
    console.log('  - Triggers created\n');

    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('✓ Verified tables in database:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n✓ Database connection closed');
  }
}

initializeDatabase();
