const express    = require('express');
const router     = express.Router();
const Transaction = require('../models/Transaction');
const protect    = require('../middleware/authMiddleware');

// ── GET /api/transactions/all ─────────────────────────────
router.get('/all', protect, async (req, res) => {
  try {
    const transactions = await Transaction
      .find({ user: req.user.id })
      .sort({ date: -1, createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ── POST /api/transactions/add ────────────────────────────
router.post('/add', protect, async (req, res) => {
  try {
    const { desc, amount, type, category, date } = req.body;

    if (!desc || !amount || !type || !category || !date)
      return res.status(400).json({ message: "All fields are required" });

    const newTx = new Transaction({
      user: req.user.id,
      desc,
      amount: Number(amount),
      type,
      category,
      date: new Date(date)
    });

    const saved = await newTx.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: "Saving Failed" });
  }
});

// ── PUT /api/transactions/update/:id ──────────────────────
router.put('/update/:id', protect, async (req, res) => {
  try {
    // 1. Find transaction
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    // 2. Ownership check — user can only update their own
    if (tx.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized to update this transaction" });

    // 3. Update
    const { desc, amount, type, category, date } = req.body;
    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: {
          desc,
          amount: Number(amount),
          type,
          category,
          date: new Date(date)
        }
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update Failed" });
  }
});

// ── DELETE /api/transactions/delete/:id ───────────────────
router.delete('/delete/:id', protect, async (req, res) => {
  try {
    // 1. Find transaction
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    // 2. Ownership check — user can only delete their own
    if (tx.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized to delete this transaction" });

    // 3. Delete
    await tx.deleteOne();
    res.json({ message: "Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete Failed" });
  }
});

module.exports = router;