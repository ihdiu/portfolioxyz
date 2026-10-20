import { query } from '../db.js';

// --- Platforms ---
export async function getAllPlatforms() {
  const [rows] = await query('SELECT * FROM research_platforms ORDER BY name ASC');
  return rows;
}

export async function getPlatformById(id) {
  const [rows] = await query('SELECT * FROM research_platforms WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createPlatform(data) {
  const [result] = await query(
    'INSERT INTO research_platforms (name, icon) VALUES (?, ?)',
    [data.name, data.icon || null]
  );
  return result.insertId;
}

export async function updatePlatform(id, data) {
  const [result] = await query(
    'UPDATE research_platforms SET name = ?, icon = ? WHERE id = ?',
    [data.name, data.icon || null, id]
  );
  return result;
}

export async function deletePlatform(id) {
  const [result] = await query('DELETE FROM research_platforms WHERE id = ?', [id]);
  return result;
}

// --- Profiles ---
export async function getAllProfiles() {
  const [rows] = await query(`
    SELECT rp.*, p.name AS platform_name, p.icon AS platform_icon
    FROM research_profiles rp
    JOIN research_platforms p ON rp.platform_id = p.id
    ORDER BY rp.sort_order ASC, rp.id ASC
  `);
  return rows;
}

export async function getProfileById(id) {
  const [rows] = await query(`
    SELECT rp.*, p.name AS platform_name
    FROM research_profiles rp
    JOIN research_platforms p ON rp.platform_id = p.id
    WHERE rp.id = ? LIMIT 1
  `, [id]);
  return rows[0] || null;
}

export async function createProfile(data) {
  const [result] = await query(
    'INSERT INTO research_profiles (platform_id, profile_url, display_label, sort_order) VALUES (?, ?, ?, ?)',
    [
      data.platform_id,
      data.profile_url,
      data.display_label || null,
      Number(data.sort_order) || 0,
    ]
  );
  return result.insertId;
}

export async function updateProfile(id, data) {
  const [result] = await query(
    'UPDATE research_profiles SET platform_id = ?, profile_url = ?, display_label = ?, sort_order = ? WHERE id = ?',
    [
      data.platform_id,
      data.profile_url,
      data.display_label || null,
      Number(data.sort_order) || 0,
      id,
    ]
  );
  return result;
}

export async function deleteProfile(id) {
  const [result] = await query('DELETE FROM research_profiles WHERE id = ?', [id]);
  return result;
}

export default {
  getAllPlatforms,
  getPlatformById,
  createPlatform,
  updatePlatform,
  deletePlatform,
  getAllProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
};
