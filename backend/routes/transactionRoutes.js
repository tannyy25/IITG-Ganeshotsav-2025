const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { sendDigitalSlip } = require('../services/emailService');

router.post('/create', async (req, res) => {
  try {
    const { name, rollNumber, email, type, itemDetails, amount } = req.body;

    if (!name || !rollNumber || !type || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields.'
      });
    }

    const newTransaction = new Transaction({
      name,
      rollNumber,
      email,
      type,
      itemDetails: itemDetails || 'N/A',
      amount,
      paymentStatus: 'SUCCESS'
    });

    const savedRecord = await newTransaction.save();

    // Non-blocking — email failure won't crash the request
    sendDigitalSlip(savedRecord).catch(err =>
      console.error('Email failed (non-critical):', err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Transaction saved successfully.',
      data: savedRecord
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
});

// GET /api/transactions/stats
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await Transaction.aggregate([
      { $match: { paymentStatus: 'SUCCESS' } },
      {
        $group: {
          _id: null,
          totalRevenue:    { $sum: '$amount' },
          totalCount:      { $sum: 1 },
          orderCount:      { $sum: { $cond: [{ $eq: ['$type', 'ORDER'] }, 1, 0] } },
          donationCount:   { $sum: { $cond: [{ $eq: ['$type', 'DONATION'] }, 1, 0] } },
          orderRevenue:    { $sum: { $cond: [{ $eq: ['$type', 'ORDER'] }, '$amount', 0] } },
          donationRevenue: { $sum: { $cond: [{ $eq: ['$type', 'DONATION'] }, '$amount', 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue:    stats?.totalRevenue    || 0,
        totalCount:      stats?.totalCount      || 0,
        orderCount:      stats?.orderCount      || 0,
        donationCount:   stats?.donationCount   || 0,
        orderRevenue:    stats?.orderRevenue    || 0,
        donationRevenue: stats?.donationRevenue || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type.toUpperCase();

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
  }
});

module.exports = router;