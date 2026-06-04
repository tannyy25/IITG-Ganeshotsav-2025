const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token
    });

  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
});

// POST /api/auth/seed  ← Run ONCE to create your admin account, then remove this route
// Body: { username, password, seedKey }
router.post('/seed', async (req, res) => {
  try {
    const { username, password, seedKey } = req.body;

    if (seedKey !== process.env.SEED_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid seed key.' });
    }

    const existing = await Admin.findOne({ username });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Admin already exists.' });
    }

    const admin = new Admin({ username, password });
    await admin.save();

    res.status(201).json({ success: true, message: `Admin '${username}' created successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Seeding failed.' });
  }
});

module.exports = router;
