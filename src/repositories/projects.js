import { query, pool } from '../db.js';

export async function getAllProjects() {
  const [rows] = await query(`
    SELECT p.*, d.slug AS domain_slug, d.name AS domain_name
    FROM projects p
    JOIN domains d ON p.domain_id = d.id
    ORDER BY p.sort_order ASC, p.id DESC
  `);

  if (rows.length === 0) return [];

  // Single JOIN for skills
  const [skillRows] = await query(`
    SELECT ps.project_id, s.id AS skill_id, s.name AS skill_name
    FROM project_skills ps
    JOIN skills s ON ps.skill_id = s.id
    ORDER BY s.name ASC
  `);

  const skillsMap = new Map();
  for (const s of skillRows) {
    if (!skillsMap.has(s.project_id)) {
      skillsMap.set(s.project_id, []);
    }
    skillsMap.get(s.project_id).push({ id: s.skill_id, name: s.skill_name });
  }

  // Single JOIN for images
  const [imageRows] = await query(`
    SELECT * FROM project_images
    ORDER BY sort_order ASC, id ASC
  `);

  const imagesMap = new Map();
  for (const img of imageRows) {
    if (!imagesMap.has(img.project_id)) {
      imagesMap.set(img.project_id, []);
    }
    imagesMap.get(img.project_id).push(img);
  }

  return rows.map((p) => ({
    ...p,
    skills: skillsMap.get(p.id) || [],
    images: imagesMap.get(p.id) || [],
  }));
}

export async function getProjectById(id) {
  const [rows] = await query(`
    SELECT p.*, d.slug AS domain_slug, d.name AS domain_name
    FROM projects p
    JOIN domains d ON p.domain_id = d.id
    WHERE p.id = ? LIMIT 1
  `, [id]);

  if (!rows[0]) return null;

  const [skills] = await query(`
    SELECT skill_id FROM project_skills WHERE project_id = ?
  `, [id]);

  const [images] = await query(`
    SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order ASC, id ASC
  `, [id]);

  return {
    ...rows[0],
    skill_ids: skills.map((s) => s.skill_id),
    images,
  };
}

export async function getProjectBySlug(slug) {
  const [rows] = await query('SELECT * FROM projects WHERE slug = ? LIMIT 1', [slug]);
  return rows[0] || null;
}

export async function createProject(data, skillIds = [], images = []) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO projects (domain_id, slug, title, summary, description, repo_url, demo_url, cover_path, is_featured, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.domain_id,
        data.slug,
        data.title,
        data.summary || null,
        data.description || null,
        data.repo_url || null,
        data.demo_url || null,
        data.cover_path || null,
        data.is_featured ? 1 : 0,
        Number(data.sort_order) || 0,
      ]
    );

    const projectId = result.insertId;

    if (Array.isArray(skillIds) && skillIds.length > 0) {
      for (const skillId of skillIds) {
        await conn.execute(
          'INSERT INTO project_skills (project_id, skill_id) VALUES (?, ?)',
          [projectId, skillId]
        );
      }
    }

    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await conn.execute(
          'INSERT INTO project_images (project_id, image_path, caption, sort_order) VALUES (?, ?, ?, ?)',
          [projectId, img.image_path, img.caption || null, i + 1]
        );
      }
    }

    await conn.commit();
    return projectId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateProject(id, data, skillIds = null, newImages = []) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE projects
       SET domain_id = ?, slug = ?, title = ?, summary = ?, description = ?,
           repo_url = ?, demo_url = ?, cover_path = COALESCE(?, cover_path),
           is_featured = ?, sort_order = ?
       WHERE id = ?`,
      [
        data.domain_id,
        data.slug,
        data.title,
        data.summary || null,
        data.description || null,
        data.repo_url || null,
        data.demo_url || null,
        data.cover_path || null,
        data.is_featured ? 1 : 0,
        Number(data.sort_order) || 0,
        id,
      ]
    );

    if (Array.isArray(skillIds)) {
      await conn.execute('DELETE FROM project_skills WHERE project_id = ?', [id]);
      for (const skillId of skillIds) {
        await conn.execute(
          'INSERT INTO project_skills (project_id, skill_id) VALUES (?, ?)',
          [id, skillId]
        );
      }
    }

    if (Array.isArray(newImages) && newImages.length > 0) {
      for (let i = 0; i < newImages.length; i++) {
        const img = newImages[i];
        await conn.execute(
          'INSERT INTO project_images (project_id, image_path, caption, sort_order) VALUES (?, ?, ?, ?)',
          [id, img.image_path, img.caption || null, i + 1]
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

export async function deleteProject(id) {
  const [result] = await query('DELETE FROM projects WHERE id = ?', [id]);
  return result;
}

export async function deleteProjectImage(imageId) {
  const [result] = await query('DELETE FROM project_images WHERE id = ?', [imageId]);
  return result;
}

export default {
  getAllProjects,
  getProjectById,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
  deleteProjectImage,
};
