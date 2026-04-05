const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validateQuery } = require('../middleware/validation');
const { querySchemas } = require('../utils/validators');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard analytics and summary endpoints
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get(
  '/',
  auth,
  validateQuery(querySchemas.dashboardFilters),
  dashboardController.getDashboard
);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get financial summary
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Financial summary
 */
router.get(
  '/summary',
  auth,
  validateQuery(querySchemas.dashboardFilters),
  dashboardController.getSummary
);

/**
 * @swagger
 * /api/dashboard/category-breakdown:
 *   get:
 *     summary: Get category-wise breakdown
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Category breakdown
 */
router.get(
  '/category-breakdown',
  auth,
  requireRole(['analyst', 'admin']),
  validateQuery(querySchemas.dashboardFilters),
  dashboardController.getCategoryBreakdown
);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get financial trends
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Financial trends
 */
router.get(
  '/trends',
  auth,
  requireRole(['analyst', 'admin']),
  validateQuery(querySchemas.trendsFilters),
  dashboardController.getTrends
);

/**
 * @swagger
 * /api/dashboard/recent-activity:
 *   get:
 *     summary: Get recent activity
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Recent transactions
 */
router.get(
  '/recent-activity',
  auth,
  dashboardController.getRecentActivity
);

module.exports = router;
