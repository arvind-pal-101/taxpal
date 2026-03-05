const express = require('express');
const { body, validationResult } = require('express-validator');
const {
    loginUser,
    registerUser,
    forgotPassword,
    verifyOTPAndResetPassword,
    refreshToken,
    logout,
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const User    = require('../models/User');

const router = express.Router();

const validate = (checks) => async (req, res, next) => {
    await Promise.all(checks.map((c) => c.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

// ── Register ────────────────────────────────────────────────
router.post('/register',
    validate([
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Invalid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be 6+ characters'),
        body('income_bracket').isNumeric().withMessage('Income must be a number'),
        body('currency').notEmpty().withMessage('Currency is required'),
    ]),
    registerUser
);

// ── Login ───────────────────────────────────────────────────
router.post('/login',
    validate([
        body('email').isEmail().withMessage('Invalid email'),
        body('password').notEmpty().withMessage('Password is required')
    ]),
    loginUser
);

// ── Forgot Password ─────────────────────────────────────────
router.post('/forgot-password',
    validate([body('email').isEmail().withMessage('Valid email is required')]),
    forgotPassword
);

// ── Verify OTP & Reset Password ─────────────────────────────
router.post('/verify-otp',
    validate([
        body('email').isEmail(),
        body('otp').notEmpty().withMessage('OTP is required'),
        body('newPassword').isLength({ min: 6 }).withMessage('Min 6 characters')
    ]),
    verifyOTPAndResetPassword
);

// ── Update Profile (name only) ──────────────────────────────
router.put('/update-profile', protect,
    validate([body('name').notEmpty().withMessage('Name is required')]),
    async (req, res) => {
        try {
            const { name } = req.body;
            const user = await User.findByIdAndUpdate(
                req.user.id,
                { name: name.trim() },
                { new: true }
            );
            if (!user) return res.status(404).json({ message: "User not found" });
            res.json({ message: "Profile updated", name: user.name });
        } catch (err) {
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ── Refresh Token ───────────────────────────────────────────
router.post('/refresh',
    validate([body('refreshToken').notEmpty()]),
    refreshToken
);

// ── Logout ──────────────────────────────────────────────────
router.post('/logout',
    validate([body('refreshToken').notEmpty()]),
    logout
);

module.exports = router;