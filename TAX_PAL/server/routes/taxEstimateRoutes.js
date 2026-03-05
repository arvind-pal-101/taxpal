const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getTaxEstimate, saveTaxEstimate } = require("../controllers/taxEstimateController");

router.get("/", protect, getTaxEstimate);
router.post("/", protect, saveTaxEstimate);

module.exports = router;