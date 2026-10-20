import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';

const app = createApp();

const server = app.listen(config.PORT, () => {
  console.log(`\n======================================================`);
  console.log(`[ONLINE] Portfolio System Online: ${config.BASE_URL}`);
  console.log(`[ADMIN]  Admin Portal:          ${config.BASE_URL}/admin`);
  console.log(`[HEALTH] Health Check:           ${config.BASE_URL}/healthz`);
  console.log(`[ENV]    Environment:            ${config.NODE_ENV}`);
  console.log(`======================================================\n`);
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n[${signal}] Initiating graceful system shutdown...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('Database connections closed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('Error during pool termination:', err);
      process.exit(1);
    }
  });

  // Force close after 5s if still hanging
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 5000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
