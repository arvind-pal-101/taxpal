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

// -----  FORGOT PASSWORD  -----
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 3600000; // 60 minutes
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { 
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS 
            }
        });

        await transporter.sendMail({
            from: `"TaxPal Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'TaxPal Password Reset OTP',
            text: `Your password reset OTP is : ${otp}. This code is valid for 60 minutes. For security reasons, do not share this code with anyone.`,
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

module.exports = { 
    loginUser, 
    registerUser, 
    forgotPassword, 
    verifyOTPAndResetPassword, 
    refreshToken, 
    logout 
};