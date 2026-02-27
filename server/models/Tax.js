const mongoose = require('mongoose');

const TaxSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  region: { type: String, required: true },
  regime: { type: String, required: true },
  totalIncome: { type: Number, required: true },
  taxableIncome: { type: Number, required: true },
  taxDue: { type: Number, required: true },
  year: { type: String, default: "2025-26" }
}, { timestamps: true });

module.exports = mongoose.model('Tax', TaxSchema);