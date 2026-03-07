exports.updateTransaction = async (req, res) => {
    try {
        const { id } = req.params; 
        const { desc, amount, type, category, date } = req.body;

        let transaction = await Transaction.findById(id);

        if (!transaction) return res.status(404).json({ message: "Transaction not found" });
        if (transaction.user.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized to update this" });
        }

    
        transaction = await Transaction.findByIdAndUpdate(
            id,
            { $set: { desc, amount, type, category, date } },
            {returnDocument: 'after' } 
        );

        res.json(transaction);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: "Transaction not found" });
        
        if (transaction.user.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        await transaction.deleteOne();
        res.json({ message: "Transaction removed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};