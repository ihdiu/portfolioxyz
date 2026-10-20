import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { doubleCsrfProtection } from '../../middleware/csrf.js';
import authRoutes from './auth.js';
import profileRoutes from './profile.js';
import sectionsRoutes from './sections.js';
import settingsRoutes from './settings.js';
import careerTreeRoutes from './careerTree.js';
import messagesRoutes from './messages.js';
import backupRoutes from './backup.js';
import { createCrudRouter } from './crud.js';
import { resources } from './resources.js';
import { query } from '../../db.js';
import { getUnreadCount } from '../../repositories/messages.js';

const router = Router();

// Public auth routes under /admin (handles login/logout with doubleCsrfProtection inside authRoutes)
router.use('/', authRoutes);

// Require admin authentication for all subsequent /admin routes
router.use(requireAdmin);

// Dashboard
router.get('/', async (req, res, next) => {
  try {
    const [
      [projectCount],
      [skillCount],
      [experienceCount],
      [educationCount],
      unreadMessages,
    ] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM projects'),
      query('SELECT COUNT(*) AS count FROM skills'),
      query('SELECT COUNT(*) AS count FROM experiences'),
      query('SELECT COUNT(*) AS count FROM educations'),
      getUnreadCount(),
    ]);

    res.render('admin/dashboard', {
      title: 'Mission Control // Admin Dashboard',
      stats: {
        projects: projectCount[0]?.count || 0,
        skills: skillCount[0]?.count || 0,
        experiences: experienceCount[0]?.count || 0,
        educations: educationCount[0]?.count || 0,
        unreadMessages,
      },
      flash: req.session.flash || null,
    });
    delete req.session.flash;
  } catch (err) {
    next(err);
  }
});

// Custom routes
router.use('/profile', profileRoutes);
router.use('/sections', sectionsRoutes);
router.use('/settings', settingsRoutes);
router.use('/career', careerTreeRoutes);
router.use('/messages', messagesRoutes);
router.use('/backup', backupRoutes);

// Generic CRUD routers for all resources
for (const resource of resources) {
  router.use(`/${resource.name}`, createCrudRouter(resource));
}

export default router;
