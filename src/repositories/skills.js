import { query } from '../db.js';

// --- Domains ---
export async function getAllDomains() {
  const [rows] = await query('SELECT * FROM domains ORDER BY id ASC');
  return rows;
}

export async function getDomainById(id) {
  const [rows] = await query('SELECT * FROM domains WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createDomain(data) {
  const [result] = await query(
    'INSERT INTO domains (slug, name) VALUES (?, ?)',
    [data.slug, data.name]
  );
  return result.insertId;
}

export async function updateDomain(id, data) {
  const [result] = await query(
    'UPDATE domains SET slug = ?, name = ? WHERE id = ?',
    [data.slug, data.name, id]
  );
  return result;
}

export async function deleteDomain(id) {
  const [result] = await query('DELETE FROM domains WHERE id = ?', [id]);
  return result;
}

// --- Skill Categories ---
export async function getAllSkillCategories() {
  const [rows] = await query(`
    SELECT sc.*, d.name AS domain_name
    FROM skill_categories sc
    JOIN domains d ON sc.domain_id = d.id
    ORDER BY d.id ASC, sc.sort_order ASC, sc.id ASC
  `);
  return rows;
}

export async function getSkillCategoryById(id) {
  const [rows] = await query('SELECT * FROM skill_categories WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createSkillCategory(data) {
  const [result] = await query(
    'INSERT INTO skill_categories (domain_id, name, sort_order) VALUES (?, ?, ?)',
    [data.domain_id, data.name, Number(data.sort_order) || 0]
  );
  return result.insertId;
}

export async function updateSkillCategory(id, data) {
  const [result] = await query(
    'UPDATE skill_categories SET domain_id = ?, name = ?, sort_order = ? WHERE id = ?',
    [data.domain_id, data.name, Number(data.sort_order) || 0, id]
  );
  return result;
}

export async function deleteSkillCategory(id) {
  const [result] = await query('DELETE FROM skill_categories WHERE id = ?', [id]);
  return result;
}

// --- Skills ---
export async function getAllSkills() {
  const [rows] = await query(`
    SELECT s.*, sc.name AS category_name, d.slug AS domain_slug, d.name AS domain_name
    FROM skills s
    JOIN skill_categories sc ON s.category_id = sc.id
    JOIN domains d ON sc.domain_id = d.id
    ORDER BY d.id ASC, sc.sort_order ASC, s.sort_order ASC, s.id ASC
  `);
  return rows;
}

export async function getSkillById(id) {
  const [rows] = await query('SELECT * FROM skills WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createSkill(data) {
  const [result] = await query(
    'INSERT INTO skills (category_id, name, proficiency, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
    [
      data.category_id,
      data.name,
      Math.min(100, Math.max(0, Number(data.proficiency) || 50)),
      data.icon || null,
      Number(data.sort_order) || 0,
    ]
  );
  return result.insertId;
}

export async function updateSkill(id, data) {
  const [result] = await query(
    'UPDATE skills SET category_id = ?, name = ?, proficiency = ?, icon = ?, sort_order = ? WHERE id = ?',
    [
      data.category_id,
      data.name,
      Math.min(100, Math.max(0, Number(data.proficiency) || 50)),
      data.icon || null,
      Number(data.sort_order) || 0,
      id,
    ]
  );
  return result;
}

export async function deleteSkill(id) {
  const [result] = await query('DELETE FROM skills WHERE id = ?', [id]);
  return result;
}

/**
 * Fetch grouped skills structured for the landing page in a single query
 */
export async function getGroupedSkills() {
  const [rows] = await query(`
    SELECT 
      d.id AS domain_id, d.slug AS domain_slug, d.name AS domain_name,
      sc.id AS category_id, sc.name AS category_name, sc.sort_order AS cat_sort,
      s.id AS skill_id, s.name AS skill_name, s.proficiency, s.icon, s.sort_order AS skill_sort
    FROM domains d
    LEFT JOIN skill_categories sc ON sc.domain_id = d.id
    LEFT JOIN skills s ON s.category_id = sc.id
    ORDER BY d.id ASC, sc.sort_order ASC, s.sort_order ASC, s.id ASC
  `);

  const domainsMap = new Map();

  for (const row of rows) {
    if (!domainsMap.has(row.domain_id)) {
      domainsMap.set(row.domain_id, {
        id: row.domain_id,
        slug: row.domain_slug,
        name: row.domain_name,
        categories: [],
      });
    }

    const domain = domainsMap.get(row.domain_id);
    if (!row.category_id) continue;

    let category = domain.categories.find((c) => c.id === row.category_id);
    if (!category) {
      category = {
        id: row.category_id,
        name: row.category_name,
        sort_order: row.cat_sort,
        skills: [],
      };
      domain.categories.push(category);
    }

    if (row.skill_id) {
      category.skills.push({
        id: row.skill_id,
        name: row.skill_name,
        proficiency: row.proficiency,
        icon: row.icon,
        sort_order: row.skill_sort,
      });
    }
  }

  return Array.from(domainsMap.values());
}

export default {
  getAllDomains,
  getDomainById,
  createDomain,
  updateDomain,
  deleteDomain,
  getAllSkillCategories,
  getSkillCategoryById,
  createSkillCategory,
  updateSkillCategory,
  deleteSkillCategory,
  getAllSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
  getGroupedSkills,
};
