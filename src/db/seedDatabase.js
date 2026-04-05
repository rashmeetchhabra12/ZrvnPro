/**
 * Database seed script
 * Loads sample data for testing
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

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Test connection
    console.log('1️⃣ Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✓ Connected to database\n');

    // Read SQL file
    console.log('2️⃣ Reading seed data file...');
    const sqlFilePath = path.join(__dirname, 'seed.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✓ Seed file loaded\n');

    // Execute SQL
    console.log('3️⃣ Inserting sample data...');
    await pool.query(sql);
    console.log('✓ Sample data inserted\n');

    // Count records
    console.log('4️⃣ Verifying data...');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const recordsCount = await pool.query('SELECT COUNT(*) FROM financial_records');

    console.log(`✓ Users: ${usersCount.rows[0].count}`);
    console.log(`✓ Financial records: ${recordsCount.rows[0].count}\n`);

    // Display test user tokens
    console.log('📝 Test User Credentials:\n');
    const users = await pool.query(`
      SELECT id, username, role
      FROM users
      WHERE status = 'active'
      ORDER BY id
    `);

    users.rows.forEach((user) => {
      const token = Buffer.from(`${user.id}:${user.role}`).toString('base64');
      console.log(`   ${user.role.toUpperCase().padEnd(8)} | Username: ${user.username.padEnd(10)} | Token: ${token}`);
    });

    console.log('\n   Password for all users: password123\n');
    console.log('✅ Database seeding completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Database seeding failed!');
    console.error('Error:', error.message);

    if (error.message.includes('duplicate key')) {
      console.error('\n💡 Tip: Data might already exist. Drop tables and re-run init script first.');
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding
seedDatabase();
