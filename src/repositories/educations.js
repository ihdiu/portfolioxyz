import { query } from '../db.js';

export async function getAllEducations() {
  const [rows] = await query(`
    SELECT ed.*, o.name AS organization_name, o.logo_path, o.website, o.location
    FROM educations ed
    JOIN organizations o ON ed.organization_id = o.id
    ORDER BY ed.sort_order ASC, ed.start_date DESC
  `);
  return rows;
}

export async function getEducationById(id) {
  const [rows] = await query(`
    SELECT ed.*, o.name AS organization_name
    FROM educations ed
    JOIN organizations o ON ed.organization_id = o.id
    WHERE ed.id = ? LIMIT 1
  `, [id]);
  return rows[0] || null;
}

export async function createEducation(data) {
  const [result] = await query(
    `INSERT INTO educations (organization_id, degree, field_of_study, start_date, end_date, grade, description, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.organization_id,
      data.degree,
      data.field_of_study || null,
      data.start_date || null,
      data.end_date || null,
      data.grade || null,
      data.description || null,
      Number(data.sort_order) || 0,
    ]
  );
  return result.insertId;
}

export async function updateEducation(id, data) {
  const [result] = await query(
    `UPDATE educations
     SET organization_id = ?, degree = ?, field_of_study = ?, start_date = ?, end_date = ?, grade = ?, description = ?, sort_order = ?
     WHERE id = ?`,
    [
      data.organization_id,
      data.degree,
      data.field_of_study || null,
      data.start_date || null,
      data.end_date || null,
      data.grade || null,
      data.description || null,
      Number(data.sort_order) || 0,
      id,
    ]
  );
  return result;
}

export async function deleteEducation(id) {
  const [result] = await query('DELETE FROM educations WHERE id = ?', [id]);
  return result;
}

export default {
  getAllEducations,
  getEducationById,
  createEducation,
  updateEducation,
  deleteEducation,
};
