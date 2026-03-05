const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getTransactions, createTransaction, deleteTransaction } = require("../controllers/transactionController");

router.get("/", protect, getTransactions);
router.post("/", protect, createTransaction);
router.delete("/:id", protect, deleteTransaction);

module.exports = router;
