require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/database');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Debug environment variables
console.log('🔍 Environment Check:');
console.log(`NODE_ENV: ${NODE_ENV}`);
console.log(`PORT: ${PORT}`);
console.log(`DB_HOST: ${process.env.DB_HOST ? 'SET' : 'MISSING'}`);
console.log(`DB_NAME: ${process.env.DB_NAME ? 'SET' : 'MISSING'}`);
console.log(`DB_USER: ${process.env.DB_USER ? 'SET' : 'MISSING'}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? 'SET' : 'MISSING'}`);
console.log('');

// Test database connection before starting server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection established');

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(50));
      console.log('Finance Backend API Server');
      console.log('='.repeat(50));
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Server running on: http://localhost:${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
      console.log('\nAPI Endpoints:');
      console.log(`  POST   /api/auth/login`);
      console.log(`  POST   /api/auth/logout`);
      console.log(`  GET    /api/auth/me`);
      console.log(`  GET    /api/users`);
      console.log(`  POST   /api/users`);
      console.log(`  GET    /api/records`);
      console.log(`  POST   /api/records`);
      console.log(`  GET    /api/dashboard/summary`);
      console.log(`  GET    /api/dashboard/trends`);
      console.log('='.repeat(50));
      console.log('\nTest Tokens (base64 encoded userId:role):');
      console.log(`  Admin:   MTphZG1pbg==`);
      console.log(`  Analyst: MjphbmFseXN0`);
      console.log(`  Viewer:  Mzp2aWV3ZXI=`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure PostgreSQL is running');
    console.error('2. Check database credentials in .env file');
    console.error('3. Create database: createdb finance_db');
    console.error('4. Initialize schema: npm run db:init');
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nSIGTERM received. Closing server gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received. Closing server gracefully...');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();
