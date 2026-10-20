import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const options = {
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
    };

    if (config.SMTP_USER && config.SMTP_PASS) {
      options.auth = {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      };
    }

    transporter = nodemailer.createTransport(options);
  }
  return transporter;
}

/**
 * Strip CR and LF characters to prevent email header injection
 */
function sanitizeHeader(str) {
  if (!str) return '';
  return String(str).replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Basic HTML escaping for message content
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Send email notification for incoming contact form submission
 * @param {Object} message - { name, email, subject, message }
 * @returns {Promise<boolean>} true if sent successfully, false otherwise
 */
export async function sendContactNotification({ name, email, subject, message }) {
  const cleanName = sanitizeHeader(name);
  const cleanEmail = sanitizeHeader(email);
  const cleanSubject = sanitizeHeader(subject || 'New Contact Transmission');

  const textBody = `New signal received from portfolio contact form:\n\n` +
    `Sender: ${cleanName} <${cleanEmail}>\n` +
    `Subject: ${cleanSubject}\n\n` +
    `Message:\n${message}\n`;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; padding: 24px; background: #0a0f14; color: #e6edf3; border-radius: 8px; border: 1px solid #22313d;">
      <h2 style="color: #22d3ee; margin-top: 0; border-bottom: 1px solid #22313d; padding-bottom: 12px;">Transmission Received</h2>
      <p style="margin: 8px 0;"><strong>From:</strong> ${escapeHtml(cleanName)} &lt;<a href="mailto:${escapeHtml(cleanEmail)}" style="color: #22d3ee;">${escapeHtml(cleanEmail)}</a>&gt;</p>
      <p style="margin: 8px 0;"><strong>Subject:</strong> ${escapeHtml(cleanSubject)}</p>
      <div style="margin-top: 16px; padding: 16px; background: #111a22; border-left: 3px solid #22d3ee; border-radius: 4px; white-space: pre-wrap; font-family: monospace; font-size: 14px; line-height: 1.5;">${escapeHtml(message)}</div>
    </div>
  `;

  try {
    const client = getTransporter();
    await client.sendMail({
      from: config.MAIL_FROM,
      to: config.MAIL_TO,
      replyTo: `"${cleanName}" <${cleanEmail}>`,
      subject: `[Portfolio] ${cleanSubject}`,
      text: textBody,
      html: htmlBody,
    });
    return true;
  } catch (err) {
    console.error('[SMTP ERROR] Failed to send contact email:', err.message);
    return false;
  }
}

export default { sendContactNotification };
