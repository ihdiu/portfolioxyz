import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'portfolio';

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);

  // First connect without specifying database to ensure DB exists
  const initConn = await mysql.createConnection({
    host,
    port,
    user,
    password,
  });

  await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await initConn.end();

  // Connect to the target database with multipleStatements enabled
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  try {
    console.log(`Running database/schema.sql on ${database}...`);
    const schemaSql = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
    await conn.query(schemaSql);
    console.log('Schema created successfully.');

    console.log(`Running database/seed.sql on ${database}...`);
    const seedSql = await fs.readFile(path.join(__dirname, 'seed.sql'), 'utf8');
    await conn.query(seedSql);
    console.log('Seed data inserted successfully.');

    console.log('Database migration completed successfully.');
  } catch (err) {
    console.error('=== MIGRATION ERROR ===');
    console.error('Message:', err.message);
    if (err.sqlMessage) console.error('SQL Message:', err.sqlMessage);
    if (err.sqlState) console.error('SQL State:', err.sqlState);
    if (err.code) console.error('Code:', err.code);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

runMigration();
