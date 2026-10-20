import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MySQLSessionStore from 'express-mysql-session';

import { config } from './config.js';
import { pool } from './db.js';
import { renderIcon } from './utils/icons.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin/index.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function createApp() {
  const app = express();
  const isProduction = config.NODE_ENV === 'production';

  // Reverse proxy trust in production
  if (isProduction) {
    app.set('trust proxy', 1);
  }

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Needed for inline career tree json embedding
            'https://challenges.cloudflare.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'"], // Needed for theme token injection
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", 'https://challenges.cloudflare.com'],
          frameSrc: ['https://challenges.cloudflare.com'],
          frameAncestors: ["'none'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // Compression
  app.use(compression());

  // Logging
  app.use(morgan(isProduction ? 'combined' : 'dev'));

  // Body and cookie parsing
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));

  // Static Assets
  app.use(
    express.static(path.join(rootDir, 'public'), {
      maxAge: isProduction ? '7d' : 0,
      etag: true,
    })
  );

  // Static Uploads with nosniff and no-execute
  app.use(
    '/uploads',
    (req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      next();
    },
    express.static(path.join(rootDir, 'uploads'), {
      maxAge: isProduction ? '30d' : 0,
      etag: true,
    })
  );

  // Session Store in MySQL
  const MySQLStore = MySQLSessionStore(session);
  const sessionStore = new MySQLStore(
    {
      clearExpired: true,
      checkExpirationInterval: 900000, // 15 mins
      expiration: 2 * 60 * 60 * 1000, // 2 hours
      createDatabaseTable: true,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data',
        },
      },
    },
    pool
  );

  app.use(
    session({
      name: 'portfolio_sid',
      secret: config.SESSION_SECRET,
      store: sessionStore,
      resave: false,
      saveUninitialized: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
      },
    })
  );

  // View Engine Setup
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Global locals for views
  app.use((req, res, next) => {
    res.locals.currentYear = new Date().getFullYear();
    res.locals.baseUrl = config.BASE_URL;
    res.locals.currentUrl = req.originalUrl;
    res.locals.adminUser = req.session?.adminId
      ? { id: req.session.adminId, email: req.session.adminEmail }
      : null;
    res.locals.icon = renderIcon;
    next();
  });

  // Mount Routes
  app.use('/admin', adminRoutes);
  app.use('/', publicRoutes);

  // Error Handling
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}

export default createApp;
