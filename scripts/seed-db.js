#!/usr/bin/env node
/**
 * Database Seeder
 *
 * Inserts sample users (with properly hashed passwords) and financial records.
 * Run with: npm run db:seed
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'password123';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DB_HOST?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false,
});

/**
 * Generate a mock auth token (base64 userId:role)
 */
const generateToken = (userId, role) =>
  Buffer.from(`${userId}:${role}`).toString('base64');

async function seedDatabase() {
  console.log('🌱 Seeding database...\n');

  try {
    // ── 1. Hash the shared password ─────────────────────────────────────────
    console.log(`🔐 Hashing password "${DEFAULT_PASSWORD}"...`);
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    console.log('✓ Password hashed\n');

    // ── 2. Clear existing data (order matters due to FK constraint) ──────────
    console.log('🧹 Clearing existing seed data...');
    await pool.query('DELETE FROM financial_records');
    await pool.query('DELETE FROM users');
    console.log('✓ Existing data cleared\n');

    // ── 3. Insert users ──────────────────────────────────────────────────────
    console.log('👤 Inserting users...');

    const usersData = [
      { username: 'admin',         email: 'admin@finance.com',    role: 'admin',    status: 'active'   },
      { username: 'analyst',       email: 'analyst@finance.com',  role: 'analyst',  status: 'active'   },
      { username: 'viewer',        email: 'viewer@finance.com',   role: 'viewer',   status: 'active'   },
      { username: 'inactive_user', email: 'inactive@finance.com', role: 'viewer',   status: 'inactive' },
    ];

    const insertedUsers = [];
    for (const u of usersData) {
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, email, role, status`,
        [u.username, u.email, passwordHash, u.role, u.status]
      );
      insertedUsers.push(result.rows[0]);
      console.log(`  ✓ Created ${u.role} user: ${u.username}`);
    }

    // ── 4. Insert financial records (using admin user's id) ──────────────────
    const adminUser = insertedUsers.find(u => u.role === 'admin');
    const adminId = adminUser.id;

    console.log('\n💰 Inserting financial records...');

    const records = [
      // Income records
      { amount: 5000.00, type: 'income',  category: 'Salary',        date: '2026-04-01', desc: 'Monthly salary'           },
      { amount: 1500.00, type: 'income',  category: 'Freelance',     date: '2026-04-05', desc: 'Web development project'   },
      { amount:  200.00, type: 'income',  category: 'Investment',    date: '2026-04-10', desc: 'Dividend payment'          },
      { amount: 5000.00, type: 'income',  category: 'Salary',        date: '2026-03-01', desc: 'Monthly salary'           },
      { amount:  800.00, type: 'income',  category: 'Freelance',     date: '2026-03-15', desc: 'Logo design'              },
      { amount:  350.00, type: 'income',  category: 'Investment',    date: '2026-02-20', desc: 'Stock dividend'           },
      { amount: 1200.00, type: 'income',  category: 'Consulting',    date: '2026-02-10', desc: 'Business consulting'      },
      // Expense records
      { amount: 1200.00, type: 'expense', category: 'Rent',          date: '2026-04-01', desc: 'Monthly rent payment'     },
      { amount:  350.00, type: 'expense', category: 'Groceries',     date: '2026-04-03', desc: 'Weekly groceries'         },
      { amount:   80.00, type: 'expense', category: 'Utilities',     date: '2026-04-05', desc: 'Electricity bill'         },
      { amount:  150.00, type: 'expense', category: 'Transport',     date: '2026-04-07', desc: 'Monthly metro pass'       },
      { amount:  200.00, type: 'expense', category: 'Entertainment', date: '2026-04-09', desc: 'Concert tickets'          },
      { amount:  300.00, type: 'expense', category: 'Healthcare',    date: '2026-04-11', desc: 'Dental checkup'           },
      { amount: 1200.00, type: 'expense', category: 'Rent',          date: '2026-03-01', desc: 'Monthly rent payment'     },
      { amount:  400.00, type: 'expense', category: 'Groceries',     date: '2026-03-10', desc: 'Monthly groceries'        },
      { amount:   75.00, type: 'expense', category: 'Utilities',     date: '2026-03-05', desc: 'Water bill'               },
      { amount:  500.00, type: 'expense', category: 'Shopping',      date: '2026-03-20', desc: 'New laptop accessories'   },
      { amount:  250.00, type: 'expense', category: 'Healthcare',    date: '2026-02-15', desc: 'Gym membership'           },
      { amount:  180.00, type: 'expense', category: 'Entertainment', date: '2026-02-25', desc: 'Streaming subscriptions'  },
    ];

    for (const r of records) {
      await pool.query(
        `INSERT INTO financial_records (amount, type, category, transaction_date, description, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [r.amount, r.type, r.category, r.date, r.desc, adminId]
      );
    }
    console.log(`  ✓ Inserted ${records.length} financial records\n`);

    // ── 5. Print summary & auth tokens ──────────────────────────────────────
    const separator = '═'.repeat(60);
    console.log(separator);
    console.log('✅  Seed complete!\n');
    console.log('📊  Summary:');
    console.log(`    Users:   ${insertedUsers.length} (${usersData.filter(u => u.status === 'active').length} active, 1 inactive)`);
    console.log(`    Records: ${records.length} financial transactions\n`);

    console.log('🔑  Auth Tokens (Bearer tokens for testing):');
    console.log('    Password for all users: password123\n');

    const activeUsers = insertedUsers.filter(u => u.status === 'active');
    for (const u of activeUsers) {
      const token = generateToken(u.id, u.role);
      const roleLabel = u.role.padEnd(8);
      console.log(`    ${roleLabel}  username: ${u.username.padEnd(12)}  token: ${token}`);
    }

    console.log('\n💡  Usage Example:');
    console.log('    curl -H "Authorization: Bearer <token>" http://localhost:3000/api/records');
    console.log(separator);

  } catch (error) {
    console.error('\n❌ Error seeding database:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
