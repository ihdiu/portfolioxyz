import { query } from '../db.js';

export async function getAllSections() {
  const [rows] = await query('SELECT * FROM sections ORDER BY sort_order ASC, id ASC');
  return rows;
}

export async function getVisibleSections() {
  const [rows] = await query('SELECT * FROM sections WHERE is_visible = 1 ORDER BY sort_order ASC, id ASC');
  return rows;
}

export async function getSectionById(id) {
  const [rows] = await query('SELECT * FROM sections WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function updateSection(id, data) {
  const [result] = await query(
    `UPDATE sections
     SET title = ?, subtitle = ?, sort_order = ?, is_visible = ?
     WHERE id = ?`,
    [
      data.title,
      data.subtitle || null,
      Number(data.sort_order) || 0,
      data.is_visible ? 1 : 0,
      id,
    ]
  );
  return result;
}

export async function toggleVisibility(id, isVisible) {
  const [result] = await query(
    'UPDATE sections SET is_visible = ? WHERE id = ?',
    [isVisible ? 1 : 0, id]
  );
  return result;
}

export async function updateSortOrders(idOrderArray) {
  for (let i = 0; i < idOrderArray.length; i++) {
    await query('UPDATE sections SET sort_order = ? WHERE id = ?', [i + 1, idOrderArray[i]]);
  }
}

export default {
  getAllSections,
  getVisibleSections,
  getSectionById,
  updateSection,
  toggleVisibility,
  updateSortOrders,
};
