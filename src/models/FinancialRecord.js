const { query } = require('../config/database');

class FinancialRecord {
  /**
   * Create a new financial record
   */
  static async create(recordData) {
    const { amount, type, category, transaction_date, description, created_by } = recordData;

    const result = await query(
      `INSERT INTO financial_records (amount, type, category, transaction_date, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [amount, type, category, transaction_date, description, created_by]
    );

    return result.rows[0];
  }

  /**
   * Find record by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM financial_records WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find all records with filters and pagination
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      startDate,
      endDate,
      search,
    } = options;

    const offset = (page - 1) * limit;
    let queryText = 'SELECT * FROM financial_records WHERE 1=1';
    const params = [];
    let paramCount = 1;

    // Apply filters
    if (type) {
      params.push(type);
      queryText += ` AND type = $${paramCount++}`;
    }

    if (category) {
      params.push(category);
      queryText += ` AND category = $${paramCount++}`;
    }

    if (startDate && endDate) {
      params.push(startDate, endDate);
      queryText += ` AND transaction_date BETWEEN $${paramCount++} AND $${paramCount++}`;
    } else if (startDate) {
      params.push(startDate);
      queryText += ` AND transaction_date >= $${paramCount++}`;
    } else if (endDate) {
      params.push(endDate);
      queryText += ` AND transaction_date <= $${paramCount++}`;
    }

    if (search) {
      params.push(`%${search}%`);
      const searchParam = paramCount++;
      queryText += ` AND (description ILIKE $${searchParam} OR category ILIKE $${searchParam})`;
    }

    // Get total count before pagination
    const countResult = await query(
      queryText.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    params.push(limit, offset);
    queryText += ` ORDER BY transaction_date DESC, created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;

    const result = await query(queryText, params);

    return {
      records: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update a financial record
   */
  static async update(id, recordData) {
    const updates = [];
    const params = [];
    let paramCount = 1;

    // Build dynamic update query
    if (recordData.amount !== undefined) {
      params.push(recordData.amount);
      updates.push(`amount = $${paramCount++}`);
    }
    if (recordData.type !== undefined) {
      params.push(recordData.type);
      updates.push(`type = $${paramCount++}`);
    }
    if (recordData.category !== undefined) {
      params.push(recordData.category);
      updates.push(`category = $${paramCount++}`);
    }
    if (recordData.transaction_date !== undefined) {
      params.push(recordData.transaction_date);
      updates.push(`transaction_date = $${paramCount++}`);
    }
    if (recordData.description !== undefined) {
      params.push(recordData.description);
      updates.push(`description = $${paramCount++}`);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(id);
    const queryText = `
      UPDATE financial_records
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(queryText, params);
    return result.rows[0];
  }

  /**
   * Delete a financial record
   */
  static async delete(id) {
    const result = await query(
      'DELETE FROM financial_records WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get financial summary (total income, expenses, net balance)
   */
  static async getSummary(filters = {}) {
    const { startDate, endDate } = filters;
    let queryText = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net_balance,
        COUNT(*) as total_transactions
      FROM financial_records
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (startDate && endDate) {
      params.push(startDate, endDate);
      queryText += ` AND transaction_date BETWEEN $${paramCount++} AND $${paramCount++}`;
    }

    const result = await query(queryText, params);
    return result.rows[0];
  }

  /**
   * Get category breakdown
   */
  static async getCategoryBreakdown(filters = {}) {
    const { type, startDate, endDate } = filters;
    let queryText = `
      SELECT
        category,
        type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count,
        AVG(amount) as average_amount
      FROM financial_records
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (type) {
      params.push(type);
      queryText += ` AND type = $${paramCount++}`;
    }

    if (startDate && endDate) {
      params.push(startDate, endDate);
      queryText += ` AND transaction_date BETWEEN $${paramCount++} AND $${paramCount++}`;
    }

    queryText += ` GROUP BY category, type ORDER BY total_amount DESC`;

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Get trends (monthly or weekly aggregations)
   */
  static async getTrends(filters = {}) {
    const { period = 'monthly', startDate, endDate } = filters;

    // Define date truncation based on period
    const dateTrunc = period === 'weekly' ? 'week' : 'month';

    let queryText = `
      SELECT
        DATE_TRUNC('${dateTrunc}', transaction_date) as period,
        type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM financial_records
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (startDate && endDate) {
      params.push(startDate, endDate);
      queryText += ` AND transaction_date BETWEEN $${paramCount++} AND $${paramCount++}`;
    }

    queryText += ` GROUP BY period, type ORDER BY period DESC, type`;

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(limit = 10) {
    const result = await query(
      `SELECT * FROM financial_records
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get all unique categories
   */
  static async getCategories() {
    const result = await query(
      'SELECT DISTINCT category FROM financial_records ORDER BY category'
    );
    return result.rows.map((row) => row.category);
  }
}

module.exports = FinancialRecord;
