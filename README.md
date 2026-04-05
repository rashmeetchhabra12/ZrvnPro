# Finance Data Processing and Access Control Backend

A RESTful API backend system for managing financial records with role-based access control, built with Node.js, Express, and PostgreSQL.

## Features

- **User Management**: Create, read, update, and delete users with role-based permissions
- **Role-Based Access Control (RBAC)**: Three-tier role system (Viewer, Analyst, Admin)
- **Financial Records Management**: Full CRUD operations for financial transactions
- **Dashboard Analytics**: Summary statistics, category breakdowns, and trends analysis
- **Input Validation**: Comprehensive validation using Joi schemas
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Pagination & Search**: Efficient data retrieval with filtering capabilities
- **Tests**: Integration tests for all endpoints

## Technology Stack

- **Backend Framework**: Node.js with Express.js
- **Database**: PostgreSQL
- **Authentication**: Mock token-based auth (base64 encoded)
- **Validation**: Joi
- **API Documentation**: Swagger UI + swagger-jsdoc
- **Testing**: Jest + Supertest
- **Password Hashing**: bcrypt

## Project Structure

```
finance-backend/
├── src/
│   ├── config/
│   │   ├── database.js         # PostgreSQL connection
│   │   └── swagger.js          # Swagger configuration
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   ├── rbac.js             # Role-based access control
│   │   ├── validation.js       # Request validation
│   │   └── errorHandler.js     # Global error handling
│   ├── models/
│   │   ├── User.js             # User model
│   │   └── FinancialRecord.js  # Financial record model
│   ├── controllers/
│   │   ├── authController.js   # Auth operations
│   │   ├── userController.js   # User management
│   │   ├── recordController.js # Financial records
│   │   └── dashboardController.js # Analytics
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── recordRoutes.js
│   │   └── dashboardRoutes.js
│   ├── utils/
│   │   ├── validators.js       # Joi schemas
│   │   └── helpers.js          # Utility functions
│   ├── db/
│   │   ├── init.sql            # Database schema
│   │   └── seed.sql            # Sample data
│   ├── app.js                  # Express app setup
│   └── server.js               # Server entry point
├── tests/
│   └── integration/
│       ├── auth.test.js
│       ├── users.test.js
│       ├── records.test.js
│       └── dashboard.test.js
├── package.json
├── .env
└── README.md
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   cd finance-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your database credentials:
   ```env
   PORT=3000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=finance_db
   DB_USER=postgres
   DB_PASSWORD=your_password

   MOCK_AUTH_ENABLED=true
   ```

4. **Create PostgreSQL database**
   ```bash
   # Using psql
   createdb finance_db

   # Or using psql command
   psql -U postgres -c "CREATE DATABASE finance_db;"
   ```

5. **Initialize database schema**
   ```bash
   psql -U postgres -d finance_db -f src/db/init.sql
   ```

6. **Load seed data (optional)**
   ```bash
   psql -U postgres -d finance_db -f src/db/seed.sql
   ```

7. **Start the server**
   ```bash
   # Development mode with nodemon
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000`

## API Documentation

Once the server is running, access the interactive API documentation at:

**Swagger UI**: http://localhost:3000/api-docs

## Authentication

This project uses mock authentication for demonstration purposes.

### Mock Token Format

Tokens are Base64-encoded strings in the format: `userId:role`

Example:
- `1:admin` → `MTphZG1pbg==`
- `2:analyst` → `MjphbmFseXN0`
- `3:viewer` → `Mzp2aWV3ZXI=`

### Test Users

After running the seed script, you can use these tokens:

| Role | User ID | Token | Username |
|------|---------|-------|----------|
| Admin | 1 | `MTphZG1pbg==` | admin |
| Analyst | 2 | `MjphbmFseXN0` | analyst |
| Viewer | 3 | `Mzp2aWV3ZXI=` | viewer |

### Using Tokens

Include the token in the Authorization header:

```bash
curl -H "Authorization: Bearer MTphZG1pbg==" http://localhost:3000/api/records
```

## Role-Based Access Control

### Roles & Permissions

| Resource | Viewer | Analyst | Admin |
|----------|--------|---------|-------|
| View Records | ✓ | ✓ | ✓ |
| View Basic Summary | ✓ | ✓ | ✓ |
| View Analytics | ✗ | ✓ | ✓ |
| Create/Edit Records | ✗ | ✗ | ✓ |
| Manage Users | ✗ | ✗ | ✓ |

### Role Descriptions

- **Viewer**: Can view financial records and basic summaries
- **Analyst**: Can view records, analytics, trends, and category breakdowns
- **Admin**: Full access including creating/editing records and managing users

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/login` | Login user | Public |
| POST | `/api/auth/logout` | Logout user | Authenticated |
| GET | `/api/auth/me` | Get current user info | Authenticated |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | List all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin, Self |
| POST | `/api/users` | Create new user | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| PATCH | `/api/users/:id/status` | Update user status | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Financial Records

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/records` | List records (with filters) | All |
| GET | `/api/records/:id` | Get record by ID | All |
| POST | `/api/records` | Create record | Admin |
| PUT | `/api/records/:id` | Update record | Admin |
| DELETE | `/api/records/:id` | Delete record | Admin |
| GET | `/api/records/categories` | Get all categories | All |

### Dashboard

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/dashboard` | Get comprehensive dashboard | All |
| GET | `/api/dashboard/summary` | Get financial summary | All |
| GET | `/api/dashboard/category-breakdown` | Get category breakdown | Analyst, Admin |
| GET | `/api/dashboard/trends` | Get trends (weekly/monthly) | Analyst, Admin |
| GET | `/api/dashboard/recent-activity` | Get recent transactions | All |

## Example API Requests

### 1. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@finance.com",
      "role": "admin"
    },
    "token": "MTphZG1pbg==",
    "tokenType": "Bearer"
  }
}
```

### 2. Create Financial Record (Admin)

```bash
curl -X POST http://localhost:3000/api/records \
  -H "Authorization: Bearer MTphZG1pbg==" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "type": "income",
    "category": "Salary",
    "transaction_date": "2026-04-01",
    "description": "Monthly salary"
  }'
```

### 3. Get Financial Summary

```bash
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer MTphZG1pbg=="
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_income": 12500,
    "total_expense": 4480,
    "net_balance": 8020,
    "total_transactions": 15
  }
}
```

### 4. Get Records with Filters

```bash
curl "http://localhost:3000/api/records?type=income&startDate=2026-04-01&endDate=2026-04-30&page=1&limit=10" \
  -H "Authorization: Bearer MTphZG1pbg=="
```

### 5. Get Category Breakdown (Analyst/Admin)

```bash
curl http://localhost:3000/api/dashboard/category-breakdown?type=expense \
  -H "Authorization: Bearer MjphbmFseXN0"
```

### 6. Get Trends

```bash
curl "http://localhost:3000/api/dashboard/trends?period=monthly" \
  -H "Authorization: Bearer MjphbmFseXN0"
```

## Query Parameters

### Financial Records Filtering

- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 10, max: 100)
- `type` (string): Filter by type (`income` or `expense`)
- `category` (string): Filter by category name
- `startDate` (date): Filter by start date (YYYY-MM-DD)
- `endDate` (date): Filter by end date (YYYY-MM-DD)
- `search` (string): Search in description and category

### Dashboard Filtering

- `startDate` (date): Start date for summary
- `endDate` (date): End date for summary
- `type` (string): Filter by type for category breakdown
- `period` (string): `weekly` or `monthly` for trends (default: monthly)

## Running Tests

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

Run specific test file:
```bash
npm test -- tests/integration/auth.test.js
```

Watch mode:
```bash
npm run test:watch
```

## Database Schema

### Users Table

```sql
id              SERIAL PRIMARY KEY
username        VARCHAR(50) UNIQUE NOT NULL
email           VARCHAR(100) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
role            VARCHAR(20) CHECK (role IN ('viewer', 'analyst', 'admin'))
status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Financial Records Table

```sql
id                SERIAL PRIMARY KEY
amount            DECIMAL(15, 2) NOT NULL CHECK (amount > 0)
type              VARCHAR(20) CHECK (type IN ('income', 'expense'))
category          VARCHAR(50) NOT NULL
transaction_date  DATE NOT NULL
description       TEXT
created_by        INTEGER REFERENCES users(id)
created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": ["Array of validation errors if applicable"]
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## Development

### Code Structure

- **Models**: Database query logic and data access
- **Controllers**: Business logic and request/response handling
- **Middleware**: Authentication, authorization, validation, error handling
- **Routes**: API endpoint definitions with middleware chaining
- **Utils**: Validation schemas and helper functions

### Adding New Endpoints

1. Create controller function in appropriate controller file
2. Add route with middleware in route file
3. Add Joi validation schema in `utils/validators.js` if needed
4. Document endpoint with Swagger comments
5. Write integration tests

## Production Considerations

This is a demonstration project. For production use, consider:

1. **Authentication**: Replace mock auth with proper JWT implementation
2. **Security**: Add rate limiting, helmet.js, input sanitization
3. **Database**: Use connection pooling, database migrations
4. **Logging**: Implement structured logging (Winston, Pino)
5. **Monitoring**: Add application monitoring (PM2, New Relic)
6. **Validation**: Add more comprehensive input validation
7. **Testing**: Increase test coverage, add unit tests
8. **Documentation**: Add JSDoc comments, API versioning
9. **Deployment**: Containerize with Docker, use environment-specific configs
10. **HTTPS**: Use SSL/TLS in production

## Troubleshooting

### Database Connection Error

```
✗ Failed to start server: connect ECONNREFUSED
```

**Solution**:
- Ensure PostgreSQL is running: `sudo service postgresql start`
- Check database credentials in `.env`
- Verify database exists: `psql -U postgres -l`

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
- Change PORT in `.env`
- Or kill process using port: `lsof -ti:3000 | xargs kill`

### Tests Failing

**Solution**:
- Ensure database is initialized with seed data
- Check that test users exist in database
- Verify PostgreSQL is running

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Contact

For questions or issues, please open an issue on the repository.
