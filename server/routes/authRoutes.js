const express    = require('express');
const { body, validationResult } = require('express-validator');
const jwt        = require('jsonwebtoken');
const { passport, googleEnabled } = require('../config/passport');
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

const makeTokensAndRedirect = (user, res, extraParams = '') => {
    const accessToken = jwt.sign(
        { id: user._id, name: user.name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
    const newRefreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
    user.refreshToken = newRefreshToken;
    user.save().catch(e => console.error('Save refreshToken error:', e));

    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(
        `${clientURL}/oauth-callback?accessToken=${accessToken}&refreshToken=${newRefreshToken}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}${extraParams}`
    );
};

if (googleEnabled) {

    // ── Google LOGIN (existing users only) ───────────────────
    router.get('/google/login',
        passport.authenticate('google-login', { scope: ['profile', 'email'], session: false })
    );

    router.get('/google/login/callback',
        (req, res, next) => {
            passport.authenticate('google-login', { session: false }, (err, user, info) => {
                if (err) {
                    console.error('❌ Google login error:', err);
                    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error`);
                }
                if (!user) {
                    // No account found — redirect back with clear message
                    console.log('❌ Google login: no account found');
                    return res.redirect(`${process.env.CLIENT_URL}/login?error=no_account`);
                }
                console.log('✅ Google login success for:', user.email);
                makeTokensAndRedirect(user, res);
            })(req, res, next);
        }
    );

    // ── Google REGISTER (create new users) ───────────────────
    router.get('/google/register',
        passport.authenticate('google-register', { scope: ['profile', 'email'], session: false })
    );

    router.get('/google/register/callback',
        (req, res, next) => {
            passport.authenticate('google-register', { session: false }, (err, user, info) => {
                if (err) {
                    console.error('❌ Google register error:', err);
                    return res.redirect(`${process.env.CLIENT_URL}/register?error=oauth_error`);
                }
                if (!user) {
                    return res.redirect(`${process.env.CLIENT_URL}/register?error=oauth_failed`);
                }
                console.log('✅ Google register success for:', user.email);
                makeTokensAndRedirect(user, res);
            })(req, res, next);
        }
    );

} else {
    router.get('/google/login',    (req, res) => res.status(503).json({ message: 'Google OAuth not configured.' }));
    router.get('/google/register', (req, res) => res.status(503).json({ message: 'Google OAuth not configured.' }));
}

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

// ── Update Profile ──────────────────────────────────────────
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