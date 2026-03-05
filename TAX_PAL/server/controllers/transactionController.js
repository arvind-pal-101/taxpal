const Transaction = require("../models/Transaction");

// GET all transactions for logged-in user
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST create a new transaction
const createTransaction = async (req, res) => {
  try {
    const { desc, amount, type, category, date } = req.body;
    if (!desc || !amount || !type || !category || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const transaction = new Transaction({
      userId: req.user.id,
      desc,
      amount: parseFloat(amount),
      type,
      category,
      date,
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE a transaction
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    await transaction.deleteOne();
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTransactions, createTransaction, deleteTransaction };
