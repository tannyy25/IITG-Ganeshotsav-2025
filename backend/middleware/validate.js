const { body, validationResult } = require('express-validator');

// Validation rules for creating a transaction
const validateTransaction = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('rollNumber')
    .trim()
    .notEmpty().withMessage('Roll number is required')
    .matches(/^[A-Za-z0-9]+$/).withMessage('Roll number must be alphanumeric'),

  body('type')
    .notEmpty().withMessage('Transaction type is required')
    .isIn(['ORDER', 'DONATION']).withMessage('Type must be ORDER or DONATION'),

  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isNumeric().withMessage('Amount must be a number')
    .custom(val => val >= 1).withMessage('Amount must be at least ₹1'),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(e => e.msg)
      });
    }
    next();
  }
];

module.exports = { validateTransaction };
