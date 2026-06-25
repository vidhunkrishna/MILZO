const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async (options) => {
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId} to ${options.to}`);
    return info;
  } catch (error) {
    logger.error(`Email send failed: ${error.message}`);
    throw error;
  }
};

const emailTemplates = {
  passwordReset: (name, resetUrl) => ({
    subject: 'MILZO – Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: #1a73e8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">MILZO</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2>Hello, ${name}!</h2>
          <p>You requested a password reset. Click the button below to reset your password.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #1a73e8; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0;">Reset Password</a>
          <p style="color: #666; font-size: 14px;">This link expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  }),

  welcomeAdmin: (name, email, tempPassword) => ({
    subject: 'MILZO – Your Admin Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: #1a73e8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">MILZO Admin Panel</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2>Welcome, ${name}!</h2>
          <p>Your admin account has been created.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p style="color: #e53e3e;">Please change your password after first login.</p>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
