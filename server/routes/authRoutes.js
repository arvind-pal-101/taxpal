const express = require('express');
const { body, validationResult } = require('express-validator');
const {
    loginUser,
    registerUser,
    requestPasswordReset,
    resetPassword,
    refreshToken,
    logout,
} = require('../controllers/authController');

const router = express.Router();

const validate = (checks) => async (req, res, next) => {
    await Promise.all(checks.map((c) => c.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

router.post(
    '/register',
    validate([
        body('name').notEmpty(),
        body('email').isEmail(),
        body('password').isLength({ min: 6 }),
        body('income_bracket').isNumeric(),
        body('currency').notEmpty(),
    ]),
    registerUser
);

router.post(
    '/login',
    validate([body('email').isEmail(), body('password').notEmpty()]),
    loginUser
);

router.post('/request-password-reset', validate([body('email').isEmail()]), requestPasswordReset);
router.post('/reset-password', validate([body('token').notEmpty(), body('newPassword').isLength({ min: 6 })]), resetPassword);

router.post('/refresh', validate([body('refreshToken').notEmpty()]), refreshToken);
router.post('/logout', validate([body('refreshToken').notEmpty()]), logout);

module.exports = router;
