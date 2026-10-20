import { Router } from 'express';
import argon2 from 'argon2';
import { findByEmail } from '../../repositories/admins.js';
import { loginRateLimiter } from '../../middleware/auth.js';
import { generateCsrfToken, doubleCsrfProtection } from '../../middleware/csrf.js';

const router = Router();

router.get('/login', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin');
  }

  res.render('admin/login', {
    title: 'Admin Access // Login',
    error: null,
    csrfToken: generateCsrfToken(req, res),
  });
});

router.post('/login', doubleCsrfProtection, loginRateLimiter, async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('admin/login', {
      title: 'Admin Access // Login',
      error: 'Invalid email or password.',
      csrfToken: generateCsrfToken(req, res),
    });
  }

  try {
    const admin = await findByEmail(email);

    // Constant-time verify
    let isValid = false;
    if (admin) {
      isValid = await argon2.verify(admin.password_hash, password);
    } else {
      // Fake verify to prevent timing attacks
      await argon2.hash(password);
    }

    if (!isValid) {
      return res.status(401).render('admin/login', {
        title: 'Admin Access // Login',
        error: 'Invalid email or password.',
        csrfToken: generateCsrfToken(req, res),
      });
    }

    // Regenerate session to prevent fixation
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.adminId = admin.id;
      req.session.adminEmail = admin.email;

      const redirectTo = req.session.returnTo || '/admin';
      delete req.session.returnTo;
      res.redirect(redirectTo);
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', doubleCsrfProtection, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.redirect('/admin/login');
  });
});

export default router;
