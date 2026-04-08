// models/Tax.js
const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // one record per user - upserted on every save
  },
  country: { type: String, default: "india" },
  regime: { type: String, enum: ["new", "old"], default: "new" },
  mode: { type: String, enum: ["salaried", "business"], default: "salaried" },
  grossIncome: { type: Number, default: 0 },
  taxableIncome: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  tdsAlreadyPaid: { type: Number, default: 0 },
  remainingTax: { type: Number, default: 0 },
  refund: { type: Number, default: 0 },
  effectiveRate: { type: String, default: "0.00" },
  quarter: { type: String, default: "Q1" }, // already added
  quarterlyStatus: {
    Q1: { type: String, enum: ["pending", "paid"], default: "pending" },
    Q2: { type: String, enum: ["pending", "paid"], default: "pending" },
    Q3: { type: String, enum: ["pending", "paid"], default: "pending" },
    Q4: { type: String, enum: ["pending", "paid"], default: "pending" },
  },
  savedAt: { type: Date, default: Date.now },
  quarter: { type: String, default: "Q1" },
  savedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Tax", taxSchema);
