const FinancialRecord = require('../models/FinancialRecord');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all financial records
 * GET /api/records
 * Access: All authenticated users
 */
const getAllRecords = asyncHandler(async (req, res) => {
  const { page, limit, type, category, startDate, endDate, search } = req.query;

  const result = await FinancialRecord.findAll({
    page,
    limit,
    type,
    category,
    startDate,
    endDate,
    search,
  });

  res.json({
    success: true,
    data: result.records,
    pagination: result.pagination,
  });
});

/**
 * Get financial record by ID
 * GET /api/records/:id
 * Access: All authenticated users
 */
const getRecordById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await FinancialRecord.findById(parseInt(id));

  if (!record) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Financial record not found',
    });
  }

  res.json({
    success: true,
    data: record,
  });
});

/**
 * Create new financial record
 * POST /api/records
 * Access: Admin only
 */
const createRecord = asyncHandler(async (req, res) => {
  const { amount, type, category, transaction_date, description } = req.body;

  const record = await FinancialRecord.create({
    amount,
    type,
    category,
    transaction_date,
    description,
    created_by: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: 'Financial record created successfully',
    data: record,
  });
});

/**
 * Update financial record
 * PUT /api/records/:id
 * Access: Admin only
 */
const updateRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if record exists
  const existingRecord = await FinancialRecord.findById(parseInt(id));
  if (!existingRecord) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Financial record not found',
    });
  }

  // Update record
  const updatedRecord = await FinancialRecord.update(parseInt(id), updateData);

  res.json({
    success: true,
    message: 'Financial record updated successfully',
    data: updatedRecord,
  });
});

/**
 * Delete financial record
 * DELETE /api/records/:id
 * Access: Admin only
 */
const deleteRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if record exists
  const existingRecord = await FinancialRecord.findById(parseInt(id));
  if (!existingRecord) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Financial record not found',
    });
  }

  // Delete record
  await FinancialRecord.delete(parseInt(id));

  res.json({
    success: true,
    message: 'Financial record deleted successfully',
  });
});

/**
 * Get available categories
 * GET /api/records/categories
 * Access: All authenticated users
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await FinancialRecord.getCategories();

  res.json({
    success: true,
    data: categories,
  });
});

module.exports = {
  getAllRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  getCategories,
};
