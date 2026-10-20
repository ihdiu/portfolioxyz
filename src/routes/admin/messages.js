import { Router } from 'express';
import {
  getAllMessages,
  getMessageById,
  markAsRead,
  deleteMessage,
} from '../../repositories/messages.js';
import { generateCsrfToken, doubleCsrfProtection } from '../../middleware/csrf.js';

const router = Router();
router.use(doubleCsrfProtection);

router.get('/', async (req, res, next) => {
  try {
    const messages = await getAllMessages();
    res.render('admin/messages/index', {
      title: 'Contact Transmission Inbox',
      messages,
      flash: req.session.flash || null,
      csrfToken: generateCsrfToken(req, res),
    });
    delete req.session.flash;
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const message = await getMessageById(req.params.id);
    if (!message) {
      return res.status(404).render('errors/404', { title: 'Message Not Found', url: req.originalUrl });
    }

    if (!message.is_read) {
      await markAsRead(message.id, true);
      message.is_read = 1;
    }

    res.render('admin/messages/view', {
      title: `Message from ${message.name}`,
      message,
      csrfToken: generateCsrfToken(req, res),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/toggle-read', async (req, res, next) => {
  try {
    const message = await getMessageById(req.params.id);
    if (message) {
      await markAsRead(message.id, !message.is_read);
    }
    res.redirect('/admin/messages');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', async (req, res, next) => {
  try {
    await deleteMessage(req.params.id);
    req.session.flash = { type: 'success', message: 'Message deleted from inbox.' };
    res.redirect('/admin/messages');
  } catch (err) {
    next(err);
  }
});

export default router;
