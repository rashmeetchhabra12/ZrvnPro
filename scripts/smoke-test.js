require('dotenv').config();
const http = require('http');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const req = (path, token, method = 'GET', body = null) =>
  new Promise((resolve) => {
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Authorization': token ? 'Bearer ' + token : '',
        'Content-Type': 'application/json',
      },
    };
    const r = http.request(opts, (resp) => {
      let d = '';
      resp.on('data', (c) => (d += c));
      resp.on('end', () => {
        try { resolve({ status: resp.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: resp.statusCode, body: d }); }
      });
    });
    r.on('error', (e) => resolve({ status: 0, body: e.message }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });

async function runTests() {
  // Fetch live tokens from DB
  const result = await pool.query("SELECT id, role FROM users WHERE status='active' ORDER BY id");
  const tokens = {};
  result.rows.forEach((u) => {
    tokens[u.role] = Buffer.from(u.id + ':' + u.role).toString('base64');
  });
  await pool.end();

  console.log('\n' + '='.repeat(52));
  console.log('  FINANCE API -- SMOKE TEST');
  console.log('='.repeat(52) + '\n');

  const pass = (label, ok, detail = '') => {
    const icon = ok ? '[PASS]' : '[FAIL]';
    console.log(`  ${icon}  ${label.padEnd(40)} ${detail}`);
  };

  // 1. Health check
  const health = await req('/health', null);
  pass('GET /health', health.status === 200, `status=${health.status}`);

  // 2. Auth
  const me = await req('/api/auth/me', tokens.admin);
  pass('GET /api/auth/me  (admin)', me.status === 200, me.body.data ? `user=${me.body.data.username} role=${me.body.data.role}` : JSON.stringify(me.body));

  // 3. Login
  const login = await req('/api/auth/login', null, 'POST', { username: 'admin', password: 'password123' });
  pass('POST /api/auth/login', login.status === 200, login.body.success ? `token=${login.body.data?.token?.slice(0, 12)}...` : JSON.stringify(login.body));

  // 4. Records — viewer can read
  const records = await req('/api/records?limit=5', tokens.viewer);
  pass('GET /api/records  (viewer)', records.status === 200, records.body.pagination ? `total=${records.body.pagination.total} returned=${records.body.data?.length}` : JSON.stringify(records.body));

  // 5. Records — viewer cannot create (403)
  const createBlocked = await req('/api/records', tokens.viewer, 'POST', { amount: 100, type: 'income', category: 'Test', transaction_date: '2026-04-01' });
  pass('POST /api/records blocked (viewer)', createBlocked.status === 403, `status=${createBlocked.status} ✓ RBAC enforced`);

  // 6. Records — admin can create
  const createRecord = await req('/api/records', tokens.admin, 'POST', { amount: 999.99, type: 'income', category: 'Test', transaction_date: '2026-04-01', description: 'Smoke test record' });
  pass('POST /api/records  (admin)', createRecord.status === 201, createRecord.body.data ? `id=${createRecord.body.data.id} amount=${createRecord.body.data.amount}` : JSON.stringify(createRecord.body));

  // 7. Search filter
  const search = await req('/api/records?search=salary', tokens.analyst);
  pass('GET /api/records?search=salary', search.status === 200, `found=${search.body.data?.length}`);

  // 8. Dashboard summary
  const summary = await req('/api/dashboard/summary', tokens.analyst);
  pass('GET /api/dashboard/summary', summary.status === 200, summary.body.data ? `income=${summary.body.data.total_income} expense=${summary.body.data.total_expense}` : JSON.stringify(summary.body));

  // 9. Dashboard trends
  const trends = await req('/api/dashboard/trends?period=monthly', tokens.analyst);
  pass('GET /api/dashboard/trends', trends.status === 200, `months=${trends.body.data?.length}`);

  // 10. Category breakdown
  const cats = await req('/api/dashboard/category-breakdown', tokens.analyst);
  pass('GET /api/dashboard/category-breakdown', cats.status === 200, `categories=${cats.body.data?.length}`);

  // 11. Recent activity
  const recent = await req('/api/dashboard/recent-activity?limit=5', tokens.viewer);
  pass('GET /api/dashboard/recent-activity', recent.status === 200, `records=${recent.body.data?.length}`);

  // 12. Users — admin only
  const users = await req('/api/users', tokens.admin);
  pass('GET /api/users  (admin)', users.status === 200, `total=${users.body.pagination?.total}`);

  // 13. Users — viewer blocked (403)
  const usersBlocked = await req('/api/users', tokens.viewer);
  pass('GET /api/users blocked (viewer)', usersBlocked.status === 403, `status=${usersBlocked.status} ✓ RBAC enforced`);

  // 14. Analyst can read records but not create
  const analystCreate = await req('/api/records', tokens.analyst, 'POST', { amount: 50, type: 'expense', category: 'Test', transaction_date: '2026-04-01' });
  pass('POST /api/records blocked (analyst)', analystCreate.status === 403, `status=${analystCreate.status} ✓ RBAC enforced`);

  // 15. Categories list
  const categories = await req('/api/records/categories', tokens.viewer);
  pass('GET /api/records/categories', categories.status === 200, `cats=${categories.body.data?.length}`);

  console.log('\n' + '='.repeat(52));
  console.log('  Auth Tokens for API testing:');
  console.log('='.repeat(52));
  Object.entries(tokens).forEach(([role, token]) => {
    console.log(`  ${role.padEnd(10)}  ${token}`);
  });
  console.log('\n  Swagger docs: http://localhost:3000/api-docs');
  console.log('  Health check: http://localhost:3000/health\n');
}

runTests().catch((e) => {
  console.error('Fatal test error:', e.message);
  process.exit(1);
});
