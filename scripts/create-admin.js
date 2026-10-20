import argon2 from 'argon2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/create-admin.js <email> <password>');
    process.exit(1);
  }

  const [email, password] = args;
  if (!email.includes('@') || password.length < 8) {
    console.error('Error: Please provide a valid email and a password of at least 8 characters.');
    process.exit(1);
  }

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const passwordDb = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'portfolio';

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password: passwordDb,
    database,
  });

  try {
    console.log(`Hashing password for ${email}...`);
    const hash = await argon2.hash(password);

    await conn.execute(
      `INSERT INTO admin_users (email, password_hash)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      [email.toLowerCase().trim(), hash]
    );

    console.log(`Admin user '${email}' created/updated successfully.`);
  } catch (err) {
    console.error('Failed to create admin user:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

createAdmin();
