require('dotenv').config();
const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User           = require('../models/User');

const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== 'your_client_id');

if (googleEnabled) {

    // ── Strategy for LOGIN (existing users only) ──────────────
    passport.use('google-login', new GoogleStrategy(
        {
            clientID:     process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:  process.env.GOOGLE_CALLBACK_URL_LOGIN || 'http://localhost:5000/api/auth/google/login/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) return done(new Error('No email from Google'), null);

                // Only find existing user — do NOT create
                const user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

                if (!user) {
                    // User not found — send special flag
                    return done(null, false, { message: 'no_account' });
                }

                // Link googleId if they signed up with email before
                if (!user.googleId) {
                    user.googleId     = profile.id;
                    user.authProvider = 'google';
                    await user.save();
                }

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    ));

    // ── Strategy for REGISTER (create new users) ──────────────
    passport.use('google-register', new GoogleStrategy(
        {
            clientID:     process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:  process.env.GOOGLE_CALLBACK_URL_REGISTER || 'http://localhost:5000/api/auth/google/register/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) return done(new Error('No email from Google'), null);

                // If user already exists, just log them in
                let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

                if (user) {
                    if (!user.googleId) {
                        user.googleId     = profile.id;
                        user.authProvider = 'google';
                        await user.save();
                    }
                    return done(null, user, { message: 'already_exists' });
                }

                // Create new user
                user = await User.create({
                    name:           profile.displayName || email.split('@')[0],
                    email,
                    googleId:       profile.id,
                    authProvider:   'google',
                    country:        'india',
                    currency:       '₹',
                    income_bracket: 0,
                });

                return done(null, user, { message: 'created' });
            } catch (err) {
                return done(err, null);
            }
        }
    ));

    console.log('✅ Google OAuth strategy registered');
} else {
    console.warn('⚠️  Google OAuth disabled — add real GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
}

module.exports = { passport, googleEnabled };