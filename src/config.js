import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  BASE_URL: z.string().url().default('http://localhost:3000'),

  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('portfolio'),

  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters long'),
  CSRF_SECRET: z.string().min(16, 'CSRF_SECRET must be at least 16 characters long'),

  SMTP_HOST: z.string().optional().default('localhost'),
  SMTP_PORT: z.coerce.number().optional().default(1025),
  SMTP_SECURE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  MAIL_FROM: z.string().default('Portfolio <no-reply@example.com>'),
  MAIL_TO: z.string().default('admin@example.com'),

  TURNSTILE_SITE_KEY: z.string().optional().default(''),
  TURNSTILE_SECRET: z.string().optional().default(''),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const config = parsed.data;
export default config;
