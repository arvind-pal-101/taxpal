const express = require('express');
const { body, validationResult } = require('express-validator');
const {
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
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// Validation Middleware
const validate = (checks) => async (req, res, next) => {
    await Promise.all(checks.map((c) => c.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

// Register Route
router.post(
    '/register',
    validate([
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Invalid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be 6+ characters'),
        body('income_bracket').isNumeric().withMessage('Income must be a number'),
        body('currency').notEmpty().withMessage('Currency is required'),
    ]),
    registerUser
);

// Login Route
router.post(
    '/login',
    validate([
        body('email').isEmail().withMessage('Invalid email'), 
        body('password').notEmpty().withMessage('Password is required')
    ]),
    loginUser
);

//  Forgot Password (Sends OTP)
router.post(
    '/forgot-password', 
    validate([body('email').isEmail().withMessage('Valid email is required')]), 
    forgotPassword
);

// Verify OTP and reset password using frontend data
router.post(
    '/verify-otp', 
    validate([
        body('email').isEmail(),
        body('otp').notEmpty().withMessage('OTP is required'),
        body('newPassword').isLength({ min: 6 }).withMessage('New password must be 6+ characters')
    ]), 
    verifyOTPAndResetPassword
);

// 5. Refresh & Logout (Requirement for JWT)
router.post('/refresh', validate([body('refreshToken').notEmpty()]), refreshToken);
router.post('/logout', validate([body('refreshToken').notEmpty()]), logout);

// Profile & Settings (protected)
router.get('/profile',               protect, getProfile);
router.put('/profile',               protect, updateProfile);
router.put('/update-password',       protect, updatePassword);
router.put('/notifications',         protect, updateNotifications);

module.exports = router;