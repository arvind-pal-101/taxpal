const express = require('express');
const router = express.Router();
const Tax = require('../models/Tax');
const protect = require('../middleware/authMiddleware');

router.post('/save', protect, async (req, res) => {
  try {
    const { region, regime, totalIncome, taxableIncome, taxDue } = req.body;

    const taxEntry = await Tax.findOneAndUpdate(
      { user: req.user.id },
      { region, regime, totalIncome, taxableIncome, taxDue },
      { new: true, upsert: true }
    );

    res.status(200).json(taxEntry);
  } catch (err) {
    res.status(500).json({ message: "Tax Save Failed", error: err.message });
  }
});

router.get('/my-tax', protect, async (req, res) => {
  try {
    const tax = await Tax.findOne({ user: req.user.id });
    res.json(tax);
  } catch (err) {
    res.status(500).json({ message: "Fetch Failed" });
  }
});

module.exports = router;