const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/all', authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: "Fetch Failed" });
  }
});

router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { budgets } = req.body; // Array of budgets
    
    await Budget.deleteMany({ user: req.user.id });
    
    const budgetsToSave = budgets.map(b => ({
      user: req.user.id,
      name: b.name,
      limit: b.limit
    }));
    
    const savedBudgets = await Budget.insertMany(budgetsToSave);
    res.json(savedBudgets);
  } catch (err) {
    res.status(500).json({ message: "Sync Failed" });
  }
});

module.exports = router;