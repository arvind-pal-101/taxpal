const Budget = require("../models/Budget");

// GET all budgets for current user (current month)
const getBudgets = async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const budgets = await Budget.find({ userId: req.user.id, month });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST create a new budget
const createBudget = async (req, res) => {
  try {
    const { name, limit, month } = req.body;
    if (!name || !limit) return res.status(400).json({ message: "Name and limit are required" });

    const currentMonth = month || new Date().toISOString().slice(0, 7);

    // Prevent duplicate category for same month
    const existing = await Budget.findOne({ userId: req.user.id, name, month: currentMonth });
    if (existing) return res.status(400).json({ message: "Budget for this category already exists this month" });

    const budget = new Budget({ userId: req.user.id, name, limit: parseFloat(limit), month: currentMonth });
    await budget.save();
    res.status(201).json(budget);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT update a budget
const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user.id });
    if (!budget) return res.status(404).json({ message: "Budget not found" });

    const { name, limit } = req.body;
    if (name) budget.name = name;
    if (limit) budget.limit = parseFloat(limit);
    await budget.save();
    res.json(budget);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE a budget
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user.id });
    if (!budget) return res.status(404).json({ message: "Budget not found" });
    await budget.deleteOne();
    res.json({ message: "Budget deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST save all budgets at once (bulk save)
const saveBudgets = async (req, res) => {
  try {
    const { budgets, month } = req.body;
    const currentMonth = month || new Date().toISOString().slice(0, 7);

    // Delete all existing budgets for this user/month and replace
    await Budget.deleteMany({ userId: req.user.id, month: currentMonth });

    const created = await Budget.insertMany(
      budgets.map(b => ({ userId: req.user.id, name: b.name, limit: parseFloat(b.limit), month: currentMonth }))
    );
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget, saveBudgets };
