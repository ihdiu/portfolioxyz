import { Router } from 'express';
import {
  getAllSections,
  getSectionById,
  updateSection,
  toggleVisibility,
  updateSortOrders,
} from '../../repositories/sections.js';
import { generateCsrfToken, doubleCsrfProtection } from '../../middleware/csrf.js';

const router = Router();
router.use(doubleCsrfProtection);

router.get('/', async (req, res, next) => {
  try {
    const sections = await getAllSections();
    res.render('admin/sections', {
      title: 'Section Manager',
      sections,
      flash: req.session.flash || null,
      csrfToken: generateCsrfToken(req, res),
    });
    delete req.session.flash;
  } catch (err) {
    next(err);
  }
});

router.post('/:id', async (req, res, next) => {
  try {
    const { title, subtitle, sort_order, is_visible } = req.body;
    await updateSection(req.params.id, {
      title,
      subtitle,
      sort_order: Number(sort_order),
      is_visible: Boolean(is_visible === '1' || is_visible === 'on' || is_visible === true),
    });

    req.session.flash = { type: 'success', message: 'Section settings updated.' };
    res.redirect('/admin/sections');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/toggle', async (req, res, next) => {
  try {
    const section = await getSectionById(req.params.id);
    if (section) {
      await toggleVisibility(section.id, !section.is_visible);
      req.session.flash = {
        type: 'success',
        message: `Section "${section.title}" is now ${!section.is_visible ? 'visible' : 'hidden'}.`,
      };
    }
    res.redirect('/admin/sections');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/move-up', async (req, res, next) => {
  try {
    const sections = await getAllSections();
    const idx = sections.findIndex((s) => s.id === Number(req.params.id));
    if (idx > 0) {
      const prev = sections[idx - 1];
      const curr = sections[idx];
      sections[idx - 1] = curr;
      sections[idx] = prev;
      await updateSortOrders(sections.map((s) => s.id));
      req.session.flash = { type: 'success', message: `Moved "${curr.title}" up.` };
    }
    res.redirect('/admin/sections');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/move-down', async (req, res, next) => {
  try {
    const sections = await getAllSections();
    const idx = sections.findIndex((s) => s.id === Number(req.params.id));
    if (idx >= 0 && idx < sections.length - 1) {
      const nextSec = sections[idx + 1];
      const curr = sections[idx];
      sections[idx + 1] = curr;
      sections[idx] = nextSec;
      await updateSortOrders(sections.map((s) => s.id));
      req.session.flash = { type: 'success', message: `Moved "${curr.title}" down.` };
    }
    res.redirect('/admin/sections');
  } catch (err) {
    next(err);
  }
});

export default router;
