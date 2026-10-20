import rateLimit from 'express-rate-limit';

/**
 * Require active admin session
 */
export function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    res.locals.adminUser = {
      id: req.session.adminId,
      email: req.session.adminEmail,
    };
    return next();
  }

  if (req.accepts('html')) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/admin/login');
  }

  return res.status(401).json({ error: 'Unauthorized: Admin session required' });
}

/**
 * Rate limiter for login route: 5 attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again after 15 minutes.',
  handler: (req, res, next, options) => {
    if (req.accepts('html')) {
      return res.status(429).render('admin/login', {
        title: 'Admin Access',
        error: options.message,
        csrfToken: req.csrfToken ? req.csrfToken() : '',
      });
    }
    return res.status(429).json({ error: options.message });
  },
});

export default { requireAdmin, loginRateLimiter };
