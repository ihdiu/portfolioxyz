import { query } from '../db.js';

export async function findByEmail(email) {
  const [rows] = await query(
    'SELECT * FROM admin_users WHERE email = ? LIMIT 1',
    [email.toLowerCase().trim()]
  );
  return rows[0] || null;
}

export async function findById(id) {
  const [rows] = await query(
    'SELECT id, email, created_at FROM admin_users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function createAdminUser(email, passwordHash) {
  const [result] = await query(
    'INSERT INTO admin_users (email, password_hash) VALUES (?, ?)',
    [email.toLowerCase().trim(), passwordHash]
  );
  return result.insertId;
}

export async function updatePassword(id, passwordHash) {
  const [result] = await query(
    'UPDATE admin_users SET password_hash = ? WHERE id = ?',
    [passwordHash, id]
  );
  return result;
}

export default {
  findByEmail,
  findById,
  createAdminUser,
  updatePassword,
};
