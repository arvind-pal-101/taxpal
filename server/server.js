require('dotenv').config(); // ← MUST be first

const express    = require("express");
const cors       = require("cors");
const { passport } = require('./config/passport'); // Load Google OAuth strategy
const connectDB  = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const protect    = require('./middleware/authMiddleware');
const errorHandler    = require('./middleware/errorHandler');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes    = require('./routes/budgetRoutes');
const taxRoutes       = require('./routes/taxRoutes');

connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth',         authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets',      budgetRoutes);
app.use('/api/taxes',        taxRoutes);

app.get("/", (req, res) => res.send("TaxPal Backend Running 🚀"));

app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "You accessed protected route", user: req.user });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('unhandledRejection', (reason) => console.error(`Unhandled Rejection: ${reason}`));
process.on('uncaughtException',  (err)    => { console.error(`Uncaught Exception: ${err.message}`); process.exit(1); });