const bcrypt     = require("bcryptjs");
const User       = require("../models/User");
const jwt        = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ── Email transporter (local only) ───────────────────────────────────────
const getTransporter = () => nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ── JWT helpers ───────────────────────────────────────────────────────────
const signAccess  = (payload) => jwt.sign(payload, process.env.JWT_SECRET,         { expiresIn: '1d'  });
const signRefresh = (payload) => jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

// ── LOGIN ─────────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const accessToken  = signAccess ({ id: user._id, name: user.name, email: user.email });
        const refreshToken = signRefresh({ id: user._id });

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

// ── REGISTER ──────────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
    try {
        const { name, email, password, country, income_bracket, currency } = req.body;
        if (!name || !email || !password || !income_bracket || !currency)
            return res.status(400).json({ message: "Required fields missing" });

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

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp        = otp;
        user.otpExpires = Date.now() + 3600000; // 60 minutes
        await user.save();

        const timeString = new Date().toLocaleString('en-IN', {
            dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata'
        });

        const otpDigits = otp.split('').map(d =>
            `<td style="padding:0 4px;">
                <div style="width:42px;height:52px;background:#f0fdf4;border:2px solid #6ee7b7;border-radius:10px;
                            font-size:26px;font-weight:900;color:#065f46;text-align:center;line-height:52px;">
                    ${d}
                </div>
            </td>`
        ).join('');

        const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>TaxPal — Password Reset</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:48px 16px;">
  <tr>
    <td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:#059669;border-radius:12px;padding:10px 22px;">
                  <span style="font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                    Tax<span style="color:#6ee7b7;">Pal</span>
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-radius:20px;padding:40px 40px 32px 40px;box-shadow:0 4px 32px rgba(0,0,0,0.08);">
            <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#0f172a;text-align:center;letter-spacing:-0.4px;">
              Password Reset Request
            </h1>
            <p style="margin:0 0 28px 0;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
              Hi <strong style="color:#0f172a;">${user.name}</strong>, we received a request to reset your TaxPal password.
              Use the OTP below to continue.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
              <tr>
                <td align="center">
                  <p style="margin:0 0 14px 0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;text-align:center;">
                    Your One-Time Password
                  </p>
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>${otpDigits}</tr>
                  </table>
                </td>
              </tr>
            </table>
            <p style="margin:18px 0 0 0;font-size:12px;color:#94a3b8;text-align:center;">
              &#128337; This OTP expires in <strong style="color:#0f172a;">60 minutes</strong>
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
              <tr><td style="border-top:1px solid #f1f5f9;"></td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff7ed;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
              <tr>
                <td>
                  <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#c2410c;">&#9888;&#65039; Security Notice</p>
                  <p style="margin:0;font-size:12px;color:#92400e;line-height:1.7;">
                    Never share this OTP with anyone — including TaxPal support.<br/>
                    TaxPal will <strong>never</strong> ask for your OTP over call, chat, or email.
                  </p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:12px;padding:16px 20px;">
              <tr>
                <td>
                  <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#334155;">&#128274; Didn't request this?</p>
                  <p style="margin:0;font-size:12px;color:#64748b;line-height:1.7;">
                    If you did not request a password reset, please ignore this email.
                    Your account remains secure and no changes have been made.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 8px 0 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e2e8f0;border-radius:12px;padding:14px 20px;">
              <tr>
                <td>
                  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Request Details</p>
                  <p style="margin:0;font-size:12px;color:#475569;line-height:1.8;">
                    &#128197; <strong>Time:</strong> ${timeString} (IST)<br/>
                    &#128231; <strong>Sent to:</strong> ${email}<br/>
                    &#128274; <strong>Valid for:</strong> 60 minutes only
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:28px 8px 0 8px;">
            <p style="margin:0 0 6px 0;font-size:12px;color:#94a3b8;">
              This is an automated security email from <strong style="color:#059669;">TaxPal</strong>.
              Please do not reply to this email.
            </p>
            <p style="margin:0;font-size:11px;color:#cbd5e1;">
              &copy; ${new Date().getFullYear()} TaxPal &nbsp;&bull;&nbsp; Secure Financial Management
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

        // ── Production: Resend | Local: Nodemailer ────────────────────────
        if (process.env.NODE_ENV === 'production') {
            const { Resend } = require('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from:    'TaxPal Security <onboarding@resend.dev>',
                to:      email,
                subject: '🔐 Your TaxPal Password Reset OTP',
                html:    htmlEmail,
            });
            console.log("Email sent via Resend to:", email);
        } else {
            await getTransporter().sendMail({
                from:    `"TaxPal Security" <${process.env.EMAIL_USER}>`,
                to:      email,
                subject: '🔐 Your TaxPal Password Reset OTP',
                text:    `Hi ${user.name},\n\nYour TaxPal password reset OTP is: ${otp}\n\nValid for 60 minutes. Never share this OTP.\n\n— TaxPal Security Team`,
                html:    htmlEmail,
            });
            console.log("Email sent via Nodemailer to:", email);
        }

        res.status(200).json({ message: "OTP sent to your email!" });
    } catch (error) {
        console.error("forgotPassword error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ── VERIFY OTP & RESET PASSWORD ───────────────────────────────────────────
const verifyOTPAndResetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user)                        return res.status(404).json({ message: "User not found" });
        if (user.otp !== otp)             return res.status(400).json({ message: "Invalid OTP" });
        if (Date.now() > user.otpExpires) return res.status(400).json({ message: "OTP expired" });

        user.password    = await bcrypt.hash(newPassword, 10);
        user.otp         = null;
        user.otpExpires  = null;
        await user.save();

        res.status(200).json({ message: "Password reset successful!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

        const user = await User.findOne({ refreshToken });
        if (!user) return res.status(401).json({ message: "Invalid refresh token" });

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const newAccessToken = signAccess({ id: user._id, name: user.name, email: user.email });
        res.json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(401).json({ message: "Token refresh failed" });
    }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const user = await User.findOne({ refreshToken });
        if (user) {
            user.refreshToken = null;
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