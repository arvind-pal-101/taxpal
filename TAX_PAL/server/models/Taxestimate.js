const mongoose = require("mongoose");

const taxEstimateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  region:        { type: String, default: "India (New)" },
  taxpayerType:  { type: String, enum: ["Business", "Salaried"], default: "Business" },
  tdsAmount:     { type: Number, default: 0 },
  paidAmounts: {
    0: { type: Number, default: 0 },
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
  },
  deductions: {
    businessExpenses:        { type: Number, default: 0 },
    retirementContributions: { type: Number, default: 0 },
    healthInsurance:         { type: Number, default: 0 },
    homeOffice:              { type: Number, default: 0 },
  },
}, { timestamps: true });

module.exports = mongoose.model("TaxEstimate", taxEstimateSchema);