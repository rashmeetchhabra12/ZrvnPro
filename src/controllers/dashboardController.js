const FinancialRecord = require('../models/FinancialRecord');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get financial summary
 * GET /api/dashboard/summary
 * Access: All authenticated users
 */
const getSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const summary = await FinancialRecord.getSummary({ startDate, endDate });

  // Convert numeric strings to numbers and format
  const formattedSummary = {
    total_income: parseFloat(summary.total_income || 0),
    total_expense: parseFloat(summary.total_expense || 0),
    net_balance: parseFloat(summary.net_balance || 0),
    total_transactions: parseInt(summary.total_transactions || 0),
  };

  res.json({
    success: true,
    data: formattedSummary,
  });
});

/**
 * Get category breakdown
 * GET /api/dashboard/category-breakdown
 * Access: Analyst and Admin
 */
const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const { type, startDate, endDate } = req.query;

  const breakdown = await FinancialRecord.getCategoryBreakdown({
    type,
    startDate,
    endDate,
  });

  // Format the results
  const formattedBreakdown = breakdown.map((item) => ({
    category: item.category,
    type: item.type,
    total_amount: parseFloat(item.total_amount || 0),
    transaction_count: parseInt(item.transaction_count || 0),
    average_amount: parseFloat(item.average_amount || 0),
  }));

  res.json({
    success: true,
    data: formattedBreakdown,
  });
});

/**
 * Get financial trends
 * GET /api/dashboard/trends
 * Access: Analyst and Admin
 */
const getTrends = asyncHandler(async (req, res) => {
  const { period, startDate, endDate } = req.query;

  const trends = await FinancialRecord.getTrends({
    period,
    startDate,
    endDate,
  });

  // Format the results
  const formattedTrends = trends.map((item) => ({
    period: item.period,
    type: item.type,
    total_amount: parseFloat(item.total_amount || 0),
    transaction_count: parseInt(item.transaction_count || 0),
  }));

  // Group by period for better visualization
  const groupedTrends = {};
  formattedTrends.forEach((item) => {
    const periodKey = item.period;
    if (!groupedTrends[periodKey]) {
      groupedTrends[periodKey] = {
        period: periodKey,
        income: 0,
        expense: 0,
        net: 0,
      };
    }

    if (item.type === 'income') {
      groupedTrends[periodKey].income = item.total_amount;
    } else if (item.type === 'expense') {
      groupedTrends[periodKey].expense = item.total_amount;
    }

    groupedTrends[periodKey].net =
      groupedTrends[periodKey].income - groupedTrends[periodKey].expense;
  });

  // Convert to array and sort by period
  const result = Object.values(groupedTrends).sort(
    (a, b) => new Date(b.period) - new Date(a.period)
  );

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get recent activity
 * GET /api/dashboard/recent-activity
 * Access: All authenticated users
 */
const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const recentRecords = await FinancialRecord.getRecentActivity(limit);

  // Format the results
  const formattedRecords = recentRecords.map((record) => ({
    ...record,
    amount: parseFloat(record.amount),
  }));

  res.json({
    success: true,
    data: formattedRecords,
  });
});

/**
 * Get comprehensive dashboard data
 * GET /api/dashboard
 * Access: All authenticated users
 * Returns summary, recent activity, and basic stats
 */
const getDashboard = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Get summary
  const summary = await FinancialRecord.getSummary({ startDate, endDate });

  // Get recent activity
  const recentActivity = await FinancialRecord.getRecentActivity(5);

  // Get basic category breakdown (top 5)
  const categoryBreakdown = await FinancialRecord.getCategoryBreakdown({
    startDate,
    endDate,
  });

  // Format and return consolidated dashboard data
  const dashboard = {
    summary: {
      total_income: parseFloat(summary.total_income || 0),
      total_expense: parseFloat(summary.total_expense || 0),
      net_balance: parseFloat(summary.net_balance || 0),
      total_transactions: parseInt(summary.total_transactions || 0),
    },
    recent_activity: recentActivity.map((record) => ({
      ...record,
      amount: parseFloat(record.amount),
    })),
    top_categories: categoryBreakdown.slice(0, 5).map((item) => ({
      category: item.category,
      type: item.type,
      total_amount: parseFloat(item.total_amount || 0),
      transaction_count: parseInt(item.transaction_count || 0),
    })),
  };

  res.json({
    success: true,
    data: dashboard,
  });
});

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getTrends,
  getRecentActivity,
  getDashboard,
};
