import { doubleCsrf } from 'csrf-csrf';
import { config } from '../config.js';

const isProduction = config.NODE_ENV === 'production';

export const {
  invalidCsrfTokenError,
  generateCsrfToken,
  validateRequest,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => config.CSRF_SECRET,
  getSessionIdentifier: (req) => req.session?.id || req.sessionID || 'anonymous',
  cookieName: 'portfolio.x-csrf-token',
  cookieOptions: {
    sameSite: 'lax',
    path: '/',
    secure: isProduction,
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req) => {
    return (
      req.headers['x-csrf-token'] ||
      req.body?._csrf ||
      req.query?._csrf
    );
  },
});

export default {
  invalidCsrfTokenError,
  generateCsrfToken,
  validateRequest,
  doubleCsrfProtection,
};
