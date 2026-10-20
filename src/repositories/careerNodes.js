import { query } from '../db.js';

export async function getAllNodes() {
  const [rows] = await query(`
    SELECT cn.*, p.title AS parent_title
    FROM career_nodes cn
    LEFT JOIN career_nodes p ON cn.parent_id = p.id
    ORDER BY cn.parent_id ASC, cn.sort_order ASC, cn.id ASC
  `);
  return rows;
}

export async function getNodeById(id) {
  const [rows] = await query('SELECT * FROM career_nodes WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

/**
 * Returns all descendant IDs for a given node using recursive traversal
 * Used for cycle prevention
 */
export async function getDescendantIds(nodeId) {
  const [allNodes] = await query('SELECT id, parent_id FROM career_nodes');
  const descendants = new Set();

  function collect(currentId) {
    for (const node of allNodes) {
      if (node.parent_id === currentId) {
        descendants.add(node.id);
        collect(node.id);
      }
    }
  }

  collect(Number(nodeId));
  return Array.from(descendants);
}

export async function createNode(data) {
  const [result] = await query(
    `INSERT INTO career_nodes (parent_id, title, description, status, target_year, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.parent_id ? Number(data.parent_id) : null,
      data.title,
      data.description || null,
      data.status || 'planned',
      data.target_year ? Number(data.target_year) : null,
      Number(data.sort_order) || 0,
    ]
  );
  return result.insertId;
}

export async function updateNode(id, data) {
  const parentId = data.parent_id ? Number(data.parent_id) : null;

  // Cycle check: parent cannot be self or any descendant
  if (parentId !== null) {
    if (parentId === Number(id)) {
      throw new Error('A career node cannot be its own parent.');
    }
    const descendants = await getDescendantIds(id);
    if (descendants.includes(parentId)) {
      throw new Error('Cycle detected: A node cannot have one of its descendants as parent.');
    }
  }

  const [result] = await query(
    `UPDATE career_nodes
     SET parent_id = ?, title = ?, description = ?, status = ?, target_year = ?, sort_order = ?
     WHERE id = ?`,
    [
      parentId,
      data.title,
      data.description || null,
      data.status || 'planned',
      data.target_year ? Number(data.target_year) : null,
      Number(data.sort_order) || 0,
      id,
    ]
  );
  return result;
}

export async function deleteNode(id) {
  const [result] = await query('DELETE FROM career_nodes WHERE id = ?', [id]);
  return result;
}

export default {
  getAllNodes,
  getNodeById,
  getDescendantIds,
  createNode,
  updateNode,
  deleteNode,
};
