const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "India (New)",
    },
    income_bracket: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    // Added: for JWT logout support
    refreshToken: {
      type: String,
    },
    // Added: notification preferences (saved from Settings page)
    notifications: {
      taxDeadlines:  { type: Boolean, default: true },
      monthlyReport: { type: Boolean, default: true },
      budgetAlerts:  { type: Boolean, default: true },
      weeklyDigest:  { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);