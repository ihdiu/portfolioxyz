import { query, pool } from '../db.js';

export async function getAllExperiences() {
  const [rows] = await query(`
    SELECT e.*, o.name AS organization_name, o.logo_path, o.website, o.location
    FROM experiences e
    JOIN organizations o ON e.organization_id = o.id
    ORDER BY e.sort_order ASC, e.start_date DESC
  `);

  // Fetch skill junction
  const [skillRows] = await query(`
    SELECT es.experience_id, s.id AS skill_id, s.name AS skill_name
    FROM experience_skills es
    JOIN skills s ON es.skill_id = s.id
    ORDER BY s.name ASC
  `);

  const skillsMap = new Map();
  for (const s of skillRows) {
    if (!skillsMap.has(s.experience_id)) {
      skillsMap.set(s.experience_id, []);
    }
    skillsMap.get(s.experience_id).push({ id: s.skill_id, name: s.skill_name });
  }

  return rows.map((exp) => ({
    ...exp,
    skills: skillsMap.get(exp.id) || [],
  }));
}

export async function getExperienceById(id) {
  const [rows] = await query(`
    SELECT e.*, o.name AS organization_name
    FROM experiences e
    JOIN organizations o ON e.organization_id = o.id
    WHERE e.id = ? LIMIT 1
  `, [id]);

  if (!rows[0]) return null;

  const [skills] = await query(`
    SELECT skill_id FROM experience_skills WHERE experience_id = ?
  `, [id]);

  return {
    ...rows[0],
    skill_ids: skills.map((s) => s.skill_id),
  };
}

export async function createExperience(data, skillIds = []) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO experiences (organization_id, role_title, start_date, end_date, description, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.organization_id,
        data.role_title,
        data.start_date,
        data.end_date || null,
        data.description || null,
        Number(data.sort_order) || 0,
      ]
    );

    const expId = result.insertId;

    if (Array.isArray(skillIds) && skillIds.length > 0) {
      for (const skillId of skillIds) {
        await conn.execute(
          'INSERT INTO experience_skills (experience_id, skill_id) VALUES (?, ?)',
          [expId, skillId]
        );
      }
    }

    await conn.commit();
    return expId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateExperience(id, data, skillIds = null) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE experiences
       SET organization_id = ?, role_title = ?, start_date = ?, end_date = ?, description = ?, sort_order = ?
       WHERE id = ?`,
      [
        data.organization_id,
        data.role_title,
        data.start_date,
        data.end_date || null,
        data.description || null,
        Number(data.sort_order) || 0,
        id,
      ]
    );

    if (Array.isArray(skillIds)) {
      await conn.execute('DELETE FROM experience_skills WHERE experience_id = ?', [id]);
      for (const skillId of skillIds) {
        await conn.execute(
          'INSERT INTO experience_skills (experience_id, skill_id) VALUES (?, ?)',
          [id, skillId]
        );
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function deleteExperience(id) {
  const [result] = await query('DELETE FROM experiences WHERE id = ?', [id]);
  return result;
}

export default {
  getAllExperiences,
  getExperienceById,
  createExperience,
  updateExperience,
  deleteExperience,
};
