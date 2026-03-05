const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes'); // ← NEW
const taxEstimateRoutes = require('./routes/taxEstimateRoutes');
const protect = require('./middleware/authMiddleware');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes); // ← NEW
app.use('/api/tax-estimate', taxEstimateRoutes);

app.get("/", (req, res) => res.send("TaxPal Backend Running 🚀"));
app.get("/api/protected", protect, (req, res) => res.json({ message: "Protected route", user: req.user }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('unhandledRejection', (reason) => console.error(`Unhandled Rejection: ${reason}`));
process.on('uncaughtException', (err) => { console.error(`Uncaught Exception: ${err.message}`); process.exit(1); });