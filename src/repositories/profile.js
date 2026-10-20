import { query } from '../db.js';

export async function getProfile() {
  const [rows] = await query('SELECT * FROM profile WHERE id = 1 LIMIT 1');
  return rows[0] || null;
}

export async function updateProfile(data) {
  const [result] = await query(
    `INSERT INTO profile (id, full_name, headline, typed_roles, bio, email, location, avatar_path, resume_path)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       full_name = VALUES(full_name),
       headline = VALUES(headline),
       typed_roles = VALUES(typed_roles),
       bio = VALUES(bio),
       email = VALUES(email),
       location = VALUES(location),
       avatar_path = COALESCE(VALUES(avatar_path), avatar_path),
       resume_path = COALESCE(VALUES(resume_path), resume_path)`,
    [
      data.full_name || '',
      data.headline || null,
      data.typed_roles || null,
      data.bio || null,
      data.email || null,
      data.location || null,
      data.avatar_path || null,
      data.resume_path || null,
    ]
  );
  return result;
}

export default { getProfile, updateProfile };
