const { query } = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

class User {
  /**
   * Find user by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find user by username (includes password hash for authentication)
   */
  static async findByUsername(username) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const result = await query(
      'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  /**
   * Get all users with pagination
   */
  static async findAll(options = {}) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    let queryText = 'SELECT id, username, email, role, status, created_at, updated_at FROM users';
    const params = [];

    // Filter by status if provided
    if (status) {
      params.push(status);
      queryText += ` WHERE status = $${params.length}`;
    }

    // Add pagination
    params.push(limit, offset);
    queryText += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await query(queryText, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users';
    if (status) {
      countQuery += ` WHERE status = '${status}'`;
    }
    const countResult = await query(countQuery);
    const total = parseInt(countResult.rows[0].count);

    return {
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    const { username, email, password, role, status = 'active' } = userData;

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO users (username, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role, status, created_at, updated_at`,
      [username, email, password_hash, role, status]
    );

    return result.rows[0];
  }

  /**
   * Update user information
   */
  static async update(id, userData) {
    const updates = [];
    const params = [];
    let paramCount = 1;

    // Build dynamic update query
    if (userData.username !== undefined) {
      params.push(userData.username);
      updates.push(`username = $${paramCount++}`);
    }
    if (userData.email !== undefined) {
      params.push(userData.email);
      updates.push(`email = $${paramCount++}`);
    }
    if (userData.password !== undefined) {
      const password_hash = await bcrypt.hash(userData.password, SALT_ROUNDS);
      params.push(password_hash);
      updates.push(`password_hash = $${paramCount++}`);
    }
    if (userData.role !== undefined) {
      params.push(userData.role);
      updates.push(`role = $${paramCount++}`);
    }
    if (userData.status !== undefined) {
      params.push(userData.status);
      updates.push(`status = $${paramCount++}`);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(id);
    const queryText = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, role, status, created_at, updated_at
    `;

    const result = await query(queryText, params);
    return result.rows[0];
  }

  /**
   * Update user status (activate/deactivate)
   */
  static async updateStatus(id, status) {
    const result = await query(
      `UPDATE users
       SET status = $1
       WHERE id = $2
       RETURNING id, username, email, role, status, created_at, updated_at`,
      [status, id]
    );
    return result.rows[0];
  }

  /**
   * Delete user (hard delete - use with caution)
   */
  static async delete(id) {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username) {
    const result = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    return result.rows.length > 0;
  }

  /**
   * Check if email exists
   */
  static async emailExists(email) {
    const result = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    return result.rows.length > 0;
  }
}

module.exports = User;
