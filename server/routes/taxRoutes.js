// routes/taxRoutes.js
const express = require('express');
const router  = express.Router();
const Tax     = require('../models/Tax');
const protect = require('../middleware/authMiddleware');

// ── POST /api/taxes/save ──────────────────────────────────
// Upsert — one record per user, always overwrites with latest
router.post('/save', protect, async (req, res) => {
  try {
    const {
      country, regime, mode,
      grossIncome, taxableIncome, totalTax,
      tdsAlreadyPaid, remainingTax, refund, effectiveRate,
    } = req.body;

    const tax = await Tax.findOneAndUpdate(
      { user: req.user._id || req.user.id },
      {
        user: req.user._id || req.user.id,
        country, regime, mode,
        grossIncome, taxableIncome, totalTax,
        tdsAlreadyPaid, remainingTax, refund, effectiveRate,
        savedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json({ success: true, tax });
  } catch (err) {
    console.error('Tax save error:', err);
    res.status(500).json({ message: 'Server error saving tax data' });
  }
});

// ── GET /api/taxes/latest ─────────────────────────────────
// Fetch latest saved tax calculation for logged-in user
router.get('/latest', protect, async (req, res) => {
  try {
    const tax = await Tax.findOne({ user: req.user._id || req.user.id });
    if (!tax) return res.status(404).json({ message: 'No tax data found' });
    res.status(200).json(tax);
  } catch (err) {
    console.error('Tax fetch error:', err);
    res.status(500).json({ message: 'Server error fetching tax data' });
  }
});

module.exports = router;