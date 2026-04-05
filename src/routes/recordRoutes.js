const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validateBody, validateQuery } = require('../middleware/validation');
const { recordSchemas, querySchemas } = require('../utils/validators');

/**
 * @swagger
 * tags:
 *   name: Financial Records
 *   description: Financial record management endpoints
 */

/**
 * Get categories needs to be before /:id route to avoid conflicts
 */
router.get(
  '/categories',
  auth,
  recordController.getCategories
);

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: Get all financial records
 *     tags: [Financial Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of financial records
 */
router.get(
  '/',
  auth,
  validateQuery(querySchemas.recordFilters),
  recordController.getAllRecords
);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get financial record by ID
 *     tags: [Financial Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Financial record details
 *       404:
 *         description: Record not found
 */
router.get(
  '/:id',
  auth,
  recordController.getRecordById
);

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create new financial record
 *     tags: [Financial Records]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *               - category
 *               - transaction_date
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               transaction_date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record created
 *       403:
 *         description: Access denied
 */
router.post(
  '/',
  auth,
  requireRole(['admin']),
  validateBody(recordSchemas.create),
  recordController.createRecord
);

/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     summary: Update financial record
 *     tags: [Financial Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               transaction_date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated
 *       404:
 *         description: Record not found
 */
router.put(
  '/:id',
  auth,
  requireRole(['admin']),
  validateBody(recordSchemas.update),
  recordController.updateRecord
);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Delete financial record
 *     tags: [Financial Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Record deleted
 *       404:
 *         description: Record not found
 */
router.delete(
  '/:id',
  auth,
  requireRole(['admin']),
  recordController.deleteRecord
);

module.exports = router;
