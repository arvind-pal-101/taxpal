const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
    if (!process.env.SMTP_HOST) {
        logger.warn('SMTP not configured — emails will not be sent');
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const sendResetEmail = async (to, token) => {
    const transporter = createTransporter();
    if (!transporter) return false;

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@taxpal.local',
        to,
        subject: 'TaxPal Password Reset',
        text: `Use this link to reset your password: ${resetUrl}`,
        html: `<p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Password reset email sent to ${to}`);
        return true;
    } catch (err) {
        logger.error(`Failed to send reset email to ${to}: ${err.message}`);
        return false;
    }
};

module.exports = { sendResetEmail };
