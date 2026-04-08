const express = require("express");
const router  = express.Router();
const Report  = require("../models/Report");
const auth    = require("../middleware/authMiddleware");

// Save report when user downloads
router.post("/save", auth, async (req, res) => {
  try {
    const { report_type, period, format } = req.body;
    const report = await Report.create({
      user_id: req.user.id,
      report_type,
      period,
      format,
      file_path: ""
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's report history
router.get("/all", auth, async (req, res) => {
  try {
    const reports = await Report.find({ user_id: req.user.id })
                                .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;