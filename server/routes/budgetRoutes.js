const express  = require('express');
const router   = express.Router();
const Budget   = require('../models/Budget');
const protect  = require('../middleware/authMiddleware');

// ── GET /api/budgets/all ──────────────────────────────────
router.get('/all', protect, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: "Fetch Failed" });
  }
});

// ── POST /api/budgets/sync ────────────────────────────────
// Replaces all budgets for this user with the new array
router.post('/sync', protect, async (req, res) => {
  try {
    const { budgets } = req.body;

    // Validation
    if (!Array.isArray(budgets))
      return res.status(400).json({ message: "Budgets must be an array" });

    // Validate each budget item
    for (const b of budgets) {
      if (!b.name || typeof b.name !== 'string' || b.name.trim() === '')
        return res.status(400).json({ message: "Each budget must have a valid name" });
      if (!b.limit || isNaN(b.limit) || Number(b.limit) <= 0)
        return res.status(400).json({ message: "Each budget must have a valid limit > 0" });
    }

    // Delete old budgets and insert new ones
    await Budget.deleteMany({ user: req.user.id });

    let savedBudgets = [];
    if (budgets.length > 0) {
      const toSave = budgets.map(b => ({
        user:  req.user.id,
        name:  b.name.trim(),
        limit: Number(b.limit)
      }));
      savedBudgets = await Budget.insertMany(toSave);
    }

    res.json(savedBudgets);
  } catch (err) {
    res.status(500).json({ message: "Sync Failed" });
  }
});

module.exports = router;