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
      default: "India",
    },
    income_bracket: {
      type: Number,
      required: true,
    },
    currency:{
        type: String,
        required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
