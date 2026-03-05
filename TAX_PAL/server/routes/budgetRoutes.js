const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getBudgets, createBudget, updateBudget, deleteBudget, saveBudgets } = require("../controllers/budgetController");

router.get("/", protect, getBudgets);
router.post("/", protect, createBudget);
router.post("/bulk", protect, saveBudgets);
router.put("/:id", protect, updateBudget);
router.delete("/:id", protect, deleteBudget);

module.exports = router;
