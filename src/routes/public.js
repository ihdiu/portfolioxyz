import crypto from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { ping } from '../db.js';
import { config } from '../config.js';
import { getLandingPageData } from '../services/landing.js';
import { createMessage, markEmailSent } from '../repositories/messages.js';
import { sendContactNotification } from '../services/mailer.js';
import { generateCsrfToken } from '../middleware/csrf.js';

const router = Router();

// Rate limiter for contact: 5 requests per IP per hour
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many transmissions sent from your IP. Please try again in an hour.' },
});

// Helper to sign form timestamps
export function generateFormTimestampSignature(timestamp) {
  return crypto.createHmac('sha256', config.SESSION_SECRET).update(String(timestamp)).digest('hex');
}

// Contact form validation schema
const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be under 120 characters'),
  email: z.string().trim().email('Please enter a valid email address').max(190),
  subject: z.string().trim().max(190).optional().nullable(),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000, 'Message must be under 5000 characters'),
  hp_field: z.string().optional(), // Honeypot
  form_time: z.string().optional(),
  form_sig: z.string().optional(),
  'cf-turnstile-response': z.string().optional(),
});

/**
 * GET /healthz
 * Returns 200 ok and tests database connectivity
 */
router.get('/healthz', async (req, res) => {
  try {
    const isDbAlive = await ping();
    if (!isDbAlive) {
      return res.status(500).json({ status: 'error', message: 'Database query failed' });
    }
    return res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * GET /robots.txt
 */
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${config.BASE_URL}/sitemap.xml\n`);
});

/**
 * GET /sitemap.xml
 */
router.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${config.BASE_URL}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
});

/**
 * GET /
 * Main landing page
 */
router.get('/', async (req, res, next) => {
  try {
    const landingData = await getLandingPageData();

    // Generate signed timestamp for contact form
    const formTimestamp = Date.now();
    const formSignature = generateFormTimestampSignature(formTimestamp);

    res.render('landing', {
      ...landingData,
      formTimestamp,
      formSignature,
      csrfToken: generateCsrfToken(req, res),
      config,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /contact
 * Validate, store, and email contact transmission
 */
router.post('/contact', contactLimiter, async (req, res) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = {};
      parsed.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      return res.status(400).json({
        ok: false,
        message: 'Validation failed. Please correct the highlighted errors.',
        errors: fieldErrors,
      });
    }

    const {
      name,
      email,
      subject,
      message,
      hp_field,
      form_time,
      form_sig,
      'cf-turnstile-response': turnstileToken,
    } = parsed.data;

    // 1. Honeypot check: If bot filled the hidden honeypot, fake success
    if (hp_field && hp_field.trim().length > 0) {
      return res.status(200).json({ ok: true, message: 'Thanks! Your transmission has been received.' });
    }

    // 2. Minimum time-to-submit check (3 seconds minimum)
    if (form_time && form_sig) {
      const expectedSig = generateFormTimestampSignature(form_time);
      if (form_sig !== expectedSig) {
        return res.status(400).json({ ok: false, message: 'Security verification failed.' });
      }
      const elapsed = Date.now() - Number(form_time);
      if (elapsed < 3000) {
        // Less than 3s - likely bot submission
        return res.status(400).json({ ok: false, message: 'Transmission sent too quickly. Please pause before submitting.' });
      }
    }

    // 3. Optional Turnstile validation
    if (config.TURNSTILE_SECRET && config.TURNSTILE_SITE_KEY) {
      if (!turnstileToken) {
        return res.status(400).json({ ok: false, message: 'Please complete the security challenge.' });
      }
      const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: config.TURNSTILE_SECRET,
          response: turnstileToken,
          remoteip: req.ip,
        }),
      });
      const cfData = await cfRes.json();
      if (!cfData.success) {
        return res.status(400).json({ ok: false, message: 'Security challenge failed.' });
      }
    }

    // 4. Store in database first
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
    const messageId = await createMessage({
      name,
      email,
      subject: subject || null,
      message,
      ip_address: clientIp,
    });

    // 5. Send email via Nodemailer
    const emailSent = await sendContactNotification({
      name,
      email,
      subject,
      message,
    });

    if (emailSent) {
      await markEmailSent(messageId, true);
    }

    return res.status(200).json({
      ok: true,
      message: 'Transmission received! Thank you for reaching out. I will respond as soon as possible.',
    });
  } catch (err) {
    console.error('Contact processing error:', err);
    return res.status(500).json({
      ok: false,
      message: 'Transmission failed due to an unexpected system error. Please try again shortly.',
    });
  }
});

export default router;
