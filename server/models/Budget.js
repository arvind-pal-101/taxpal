const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { type: String, required: true }, 
  limit: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Budget', BudgetSchema);