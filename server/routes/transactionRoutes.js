const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware'); 

router.get('/all', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { desc, amount, type, category, date } = req.body;
    const newTx = new Transaction({
      user: req.user.id,
      desc,
      amount,
      type,
      category,
      date
    });
    const savedTx = await newTx.save();
    res.json(savedTx);
  } catch (err) {
    res.status(500).json({ message: "Saving Failed" });
  }
});

router.put('/update/:id', authMiddleware, async (req, res) => {
  try {
    const updatedTx = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedTx);
  } catch (err) {
    res.status(500).json({ message: "Update Failed" });
  }
});

router.delete('/delete/:id', authMiddleware, async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete Failed" });
  }
});

module.exports = router;