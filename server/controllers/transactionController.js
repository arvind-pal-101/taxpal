// NOTE: All transaction logic is now handled directly in transactionRoutes.js
// This file is kept for reference only — routes use inline handlers with proper
// ownership checks. Do not use these exports in routes.

const Transaction = require('../models/Transaction');

exports.updateTransaction = async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.id);
        if (!tx) return res.status(404).json({ message: "Transaction not found" });
        if (tx.user.toString() !== req.user.id)
            return res.status(403).json({ message: "Not authorized" });

        const { desc, amount, type, category, date } = req.body;
        const updated = await Transaction.findByIdAndUpdate(
            req.params.id,
            { $set: { desc, amount: Number(amount), type, category, date: new Date(date) } },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.id);
        if (!tx) return res.status(404).json({ message: "Transaction not found" });
        if (tx.user.toString() !== req.user.id)
            return res.status(403).json({ message: "Not authorized" });

        await tx.deleteOne();
        res.json({ message: "Transaction removed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};