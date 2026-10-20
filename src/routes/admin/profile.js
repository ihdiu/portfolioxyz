import { Router } from 'express';
import { getProfile, updateProfile } from '../../repositories/profile.js';
import { upload, saveProcessedImage, saveDocument } from '../../middleware/upload.js';
import { generateCsrfToken, doubleCsrfProtection } from '../../middleware/csrf.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const profile = await getProfile();
    res.render('admin/profile', {
      title: 'Profile & Identity',
      profile: profile || {},
      errors: {},
      flash: req.session.flash || null,
      csrfToken: generateCsrfToken(req, res),
    });
    delete req.session.flash;
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'resume_file', maxCount: 1 },
  ]),
  doubleCsrfProtection,
  async (req, res, next) => {
    try {
      const current = (await getProfile()) || {};
      const { full_name, headline, typed_roles, bio, email, location } = req.body;

      let avatar_path = current.avatar_path;
      let resume_path = current.resume_path;

      if (req.files?.avatar?.[0]) {
        avatar_path = await saveProcessedImage(req.files.avatar[0].buffer, { maxWidth: 600 });
      }

      if (req.files?.resume_file?.[0]) {
        resume_path = await saveDocument(req.files.resume_file[0].buffer);
      }

      await updateProfile({
        full_name,
        headline,
        typed_roles,
        bio,
        email,
        location,
        avatar_path,
        resume_path,
      });

      req.session.flash = { type: 'success', message: 'Profile updated successfully.' };
      res.redirect('/admin/profile');
    } catch (err) {
      next(err);
    }
  }
);

export default router;
