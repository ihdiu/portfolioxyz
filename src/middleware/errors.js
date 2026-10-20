import { config } from '../config.js';

export function notFoundHandler(req, res, next) {
  if (req.accepts('html')) {
    return res.status(404).render('errors/404', {
      title: '404 - Signal Lost',
      url: req.originalUrl,
    });
  }
  return res.status(404).json({ error: 'Resource not found', status: 404 });
}

export function globalErrorHandler(err, req, res, next) {
  const isDev = config.NODE_ENV === 'development';
  console.error('[SERVER ERROR]', err);

  let status = err.status || err.statusCode || 500;
  if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('csrf')) {
    status = 403;
  }
  const message = (isDev || status < 500) ? err.message : 'An unexpected error occurred on the server.';

  if (req.accepts('html')) {
    return res.status(status).render('errors/500', {
      title: `${status} - System Fault`,
      status,
      message,
      stack: isDev ? err.stack : null,
    });
  }

  return res.status(status).json({
    error: message,
    status,
    ...(isDev && { stack: err.stack }),
  });
}

export default { notFoundHandler, globalErrorHandler };
