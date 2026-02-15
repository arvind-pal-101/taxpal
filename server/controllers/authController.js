const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const logger = require('../utils/logger');
const { sendResetEmail } = require('../utils/email');

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });

    // store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({ message: 'Login successful', accessToken, refreshToken });
  } catch (error) {
    logger.error(`loginUser error: ${error.message}`);
    next(error);
  }
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, country, income_bracket, currency } = req.body;

    if (!name || !email || !password || !income_bracket || !currency) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({ name, email, password: hashedPassword, country, income_bracket, currency });

    logger.info(`New user registered: ${email}`);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    logger.error(`registerUser error: ${error.message}`);
    next(error);
  }
};

// Request password reset: generate token, save on user, send email
const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600 * 1000; // 1 hour
    await user.save();

    // send email (best-effort)
    await sendResetEmail(email, token);

    logger.info(`Password reset requested for ${email}`);
    res.json({ message: 'Password reset email sent if account exists' });
  } catch (error) {
    logger.error(`requestPasswordReset error: ${error.message}`);
    next(error);
  }
};

// Reset password using token
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and newPassword required' });

    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`Password reset for ${user.email}`);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error(`resetPassword error: ${error.message}`);
    next(error);
  }
};

// Refresh access token using refresh token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });

    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });

    // verify token
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ accessToken });
  } catch (error) {
    logger.error(`refreshToken error: ${error.message}`);
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });

    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    res.json({ message: 'Logged out' });
  } catch (error) {
    logger.error(`logout error: ${error.message}`);
    next(error);
  }
};

module.exports = { loginUser, registerUser, requestPasswordReset, resetPassword, refreshToken, logout };
