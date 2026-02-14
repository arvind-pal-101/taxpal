const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const protect = require("./middleware/authMiddleware");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ strict: false }));
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("TaxPal Backend Running");
});
app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "You accessed protected route", user: req.user });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
