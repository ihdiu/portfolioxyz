import { query } from '../db.js';

export async function getAllMessages() {
  const [rows] = await query('SELECT * FROM contact_messages ORDER BY created_at DESC');
  return rows;
}

export async function getUnreadCount() {
  const [rows] = await query('SELECT COUNT(*) AS count FROM contact_messages WHERE is_read = 0');
  return rows[0]?.count || 0;
}

export async function getMessageById(id) {
  const [rows] = await query('SELECT * FROM contact_messages WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createMessage(data) {
  const [result] = await query(
    `INSERT INTO contact_messages (name, email, subject, message, ip_address, is_read, email_sent)
     VALUES (?, ?, ?, ?, ?, 0, 0)`,
    [
      data.name,
      data.email,
      data.subject || null,
      data.message,
      data.ip_address || null,
    ]
  );
  return result.insertId;
}

export async function markAsRead(id, isRead = true) {
  const [result] = await query('UPDATE contact_messages SET is_read = ? WHERE id = ?', [isRead ? 1 : 0, id]);
  return result;
}

export async function markEmailSent(id, emailSent = true) {
  const [result] = await query('UPDATE contact_messages SET email_sent = ? WHERE id = ?', [emailSent ? 1 : 0, id]);
  return result;
}

export async function deleteMessage(id) {
  const [result] = await query('DELETE FROM contact_messages WHERE id = ?', [id]);
  return result;
}

export default {
  getAllMessages,
  getUnreadCount,
  getMessageById,
  createMessage,
  markAsRead,
  markEmailSent,
  deleteMessage,
};
