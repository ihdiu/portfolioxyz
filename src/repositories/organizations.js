import { query } from '../db.js';

export async function getAllOrganizations() {
  const [rows] = await query('SELECT * FROM organizations ORDER BY name ASC');
  return rows;
}

export async function getOrganizationById(id) {
  const [rows] = await query('SELECT * FROM organizations WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createOrganization(data) {
  const [result] = await query(
    'INSERT INTO organizations (name, website, location, logo_path) VALUES (?, ?, ?, ?)',
    [data.name, data.website || null, data.location || null, data.logo_path || null]
  );
  return result.insertId;
}

export async function updateOrganization(id, data) {
  const [result] = await query(
    'UPDATE organizations SET name = ?, website = ?, location = ?, logo_path = COALESCE(?, logo_path) WHERE id = ?',
    [data.name, data.website || null, data.location || null, data.logo_path || null, id]
  );
  return result;
}

export async function deleteOrganization(id) {
  const [result] = await query('DELETE FROM organizations WHERE id = ?', [id]);
  return result;
}

export default {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
};
