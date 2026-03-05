const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ------ LOGIN (JWT + Refresh Tokens) -----
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Requirement: Access Token
        const accessToken = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET || "taxpal_secret_123", 
            { expiresIn: '1d' }
        );

        // Refresh Token
        const refreshToken = jwt.sign(
            { id: user._id }, 
            process.env.JWT_REFRESH_SECRET || "taxpal_refresh_456", 
            { expiresIn: '7d' }
        );

        // Store refresh token in DB
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({ 
            message: "Login successful", 
            accessToken, 
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// -----  REGISTER -----
const registerUser = async (req, res) => {
    try {
        const { name, email, password, country, income_bracket, currency } = req.body;
        if (!name || !email || !password || !income_bracket || !currency) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ name, email, password: hashedPassword, country, income_bracket, currency });
        
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// -----  FORGOT PASSWORD (OTP Bhejna) -----
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { 
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS 
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'TaxPal Password Reset OTP',
            text: `Aapka password reset OTP hai: ${otp}. Ye 1 ghante tak valid hai.`
        });

        res.status(200).json({ message: "OTP sent to your email!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// -----  VERIFY OTP & RESET  -----
const verifyOTPAndResetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
        if (Date.now() > user.otpExpires) return res.status(400).json({ message: "OTP expired" });

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successful!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// -----  REFRESH TOKEN (For Security) -----
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

        const user = await User.findOne({ refreshToken });
        if (!user) return res.status(401).json({ message: "Invalid refresh token" });

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "taxpal_refresh_456");

        const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "taxpal_secret_123", { expiresIn: '1d' });
        res.json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(401).json({ message: "Token refresh failed" });
    }
};

// -----  LOGOUT -----
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const user = await User.findOne({ refreshToken });
        if (user) {
            user.refreshToken = undefined;
            await user.save();
        }
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// ----- GET PROFILE -----
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp -otpExpires -refreshToken');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// ----- UPDATE PROFILE (name, country, income_bracket) -----
const updateProfile = async (req, res) => {
    try {
        const { name, country, income_bracket } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (name)             user.name           = name;
        if (country)          user.country        = country;
        if (income_bracket !== undefined) user.income_bracket = income_bracket;
        await user.save();
        res.json({ message: "Profile updated", user: { name: user.name, email: user.email, country: user.country, income_bracket: user.income_bracket } });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// ----- UPDATE PASSWORD -----
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ message: "All fields required" });
        if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// ----- UPDATE NOTIFICATIONS -----
const updateNotifications = async (req, res) => {
    try {
        const { taxDeadlines, monthlyReport, budgetAlerts, weeklyDigest } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        user.notifications = { taxDeadlines, monthlyReport, budgetAlerts, weeklyDigest };
        await user.save();
        res.json({ message: "Notifications updated", notifications: user.notifications });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { 
    loginUser, 
    registerUser, 
    forgotPassword, 
    verifyOTPAndResetPassword, 
    refreshToken, 
    logout,
    getProfile,
    updateProfile,
    updatePassword,
    updateNotifications,
};