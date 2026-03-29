const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name:     { type: String, required: true },
  limit:    { type: Number, required: true },
  month:    { type: String, required: true }, // e.g. "2026-02"
}, { timestamps: true });

module.exports = mongoose.model("Budget", budgetSchema);
