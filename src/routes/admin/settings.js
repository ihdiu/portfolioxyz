import { Router } from 'express';
import { getAllSettings, updateMultipleSettings } from '../../repositories/settings.js';
import { generateCsrfToken, doubleCsrfProtection } from '../../middleware/csrf.js';

const router = Router();
router.use(doubleCsrfProtection);

router.get('/', async (req, res, next) => {
  try {
    const settings = await getAllSettings();
    res.render('admin/settings', {
      title: 'Appearance & System Settings',
      settings,
      flash: req.session.flash || null,
      csrfToken: generateCsrfToken(req, res),
    });
    delete req.session.flash;
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      theme_default,
      accent_primary,
      accent_secondary,
      animations_enabled,
      site_title,
      meta_description,
      og_image,
    } = req.body;

    await updateMultipleSettings({
      theme_default: theme_default === 'light' ? 'light' : 'dark',
      accent_primary: accent_primary || '#22d3ee',
      accent_secondary: accent_secondary || '#f59e0b',
      animations_enabled: animations_enabled ? '1' : '0',
      site_title: site_title || 'Portfolio',
      meta_description: meta_description || '',
      og_image: og_image || '',
    });

    req.session.flash = { type: 'success', message: 'System settings saved successfully.' };
    res.redirect('/admin/settings');
  } catch (err) {
    next(err);
  }
});

export default router;
