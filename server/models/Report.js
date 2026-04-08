const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  report_type: { type: String, required: true },
  period:      { type: String, required: true },
  format:      { type: String, default: "PDF" },
  file_path:   { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);