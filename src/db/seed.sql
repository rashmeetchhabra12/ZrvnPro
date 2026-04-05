-- Seed data for testing
-- Password for all users: "password123" (hashed with bcrypt)
-- bcrypt hash of "password123": $2b$10$YourHashHere (generated during actual use)

-- Insert sample users with different roles
INSERT INTO users (username, email, password_hash, role, status) VALUES
  ('admin', 'admin@finance.com', '$2b$10$vK9XqZ8Kj8EqzHJ5YqO5a.X5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 'admin', 'active'),
  ('analyst', 'analyst@finance.com', '$2b$10$vK9XqZ8Kj8EqzHJ5YqO5a.X5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 'analyst', 'active'),
  ('viewer', 'viewer@finance.com', '$2b$10$vK9XqZ8Kj8EqzHJ5YqO5a.X5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 'viewer', 'active'),
  ('inactive_user', 'inactive@finance.com', '$2b$10$vK9XqZ8Kj8EqzHJ5YqO5a.X5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 'viewer', 'inactive');

-- Insert sample financial records
INSERT INTO financial_records (amount, type, category, transaction_date, description, created_by) VALUES
  -- Income records
  (5000.00, 'income', 'Salary', '2026-04-01', 'Monthly salary', 1),
  (1500.00, 'income', 'Freelance', '2026-04-05', 'Web development project', 1),
  (200.00, 'income', 'Investment', '2026-04-10', 'Dividend payment', 1),
  (5000.00, 'income', 'Salary', '2026-03-01', 'Monthly salary', 1),
  (800.00, 'income', 'Freelance', '2026-03-15', 'Logo design', 1),

  -- Expense records
  (1200.00, 'expense', 'Rent', '2026-04-01', 'Monthly rent payment', 1),
  (350.00, 'expense', 'Groceries', '2026-04-03', 'Weekly groceries', 1),
  (80.00, 'expense', 'Utilities', '2026-04-05', 'Electricity bill', 1),
  (150.00, 'expense', 'Transportation', '2026-04-07', 'Monthly metro pass', 1),
  (200.00, 'expense', 'Entertainment', '2026-04-09', 'Concert tickets', 1),
  (300.00, 'expense', 'Healthcare', '2026-04-11', 'Dental checkup', 1),
  (1200.00, 'expense', 'Rent', '2026-03-01', 'Monthly rent payment', 1),
  (400.00, 'expense', 'Groceries', '2026-03-10', 'Monthly groceries', 1),
  (75.00, 'expense', 'Utilities', '2026-03-05', 'Water bill', 1),
  (500.00, 'expense', 'Shopping', '2026-03-20', 'New laptop accessories', 1);

-- Display seed data summary
SELECT 'Seed data inserted successfully!' AS message;
SELECT 'Users created: ' || COUNT(*) FROM users;
SELECT 'Financial records created: ' || COUNT(*) FROM financial_records;

-- Display user credentials for testing
SELECT
  '=== Test User Credentials ===' AS info
UNION ALL
SELECT
  'Username: ' || username || ' | Role: ' || role || ' | Token (base64): ' ||
  encode(convert_to(id::text || ':' || role, 'UTF8'), 'base64')
FROM users
WHERE status = 'active'
ORDER BY
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'analyst' THEN 2
    WHEN 'viewer' THEN 3
  END;
