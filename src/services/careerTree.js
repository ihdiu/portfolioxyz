/**
 * Transform flat list of career nodes into nested tree structure
 * @param {Array} flatNodes 
 * @returns {Array} List of root nodes with nested children
 */
export function buildNestedTree(flatNodes) {
  if (!Array.isArray(flatNodes) || flatNodes.length === 0) {
    return [];
  }

  const nodesMap = new Map();
  flatNodes.forEach((node) => {
    nodesMap.set(node.id, {
      ...node,
      children: [],
    });
  });

  const roots = [];

  flatNodes.forEach((node) => {
    const current = nodesMap.get(node.id);
    if (node.parent_id && nodesMap.has(node.parent_id)) {
      nodesMap.get(node.parent_id).children.push(current);
    } else {
      roots.push(current);
    }
  });

  // Sort children by sort_order
  function sortChildren(node) {
    node.children.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    node.children.forEach(sortChildren);
  }

  roots.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  roots.forEach(sortChildren);

  return roots;
}

/**
 * Check if setting childId to have targetParentId would cause a cycle
 * @param {Array} flatNodes 
 * @param {number} childId 
 * @param {number|null} targetParentId 
 * @returns {boolean} true if cycle detected, false if safe
 */
export function wouldCauseCycle(flatNodes, childId, targetParentId) {
  if (!targetParentId) return false;
  if (Number(childId) === Number(targetParentId)) return true;

  const parentMap = new Map();
  flatNodes.forEach((n) => {
    parentMap.set(n.id, n.parent_id);
  });

  let curr = targetParentId;
  const visited = new Set();

  while (curr) {
    if (curr === Number(childId)) return true;
    if (visited.has(curr)) return true;
    visited.add(curr);
    curr = parentMap.get(curr);
  }

  return false;
}

/**
 * Render noscript HTML list for accessible fallback
 * @param {Array} treeNodes 
 * @returns {string} HTML <ul>
 */
export function renderNoscriptTree(treeNodes) {
  if (!treeNodes || treeNodes.length === 0) return '';

  let html = '<ul class="career-tree-noscript-list">\n';
  for (const node of treeNodes) {
    const yearStr = node.target_year ? ` [${node.target_year}]` : '';
    const statusClass = `status-${node.status}`;
    html += `  <li class="${statusClass}">\n`;
    html += `    <strong>${escapeHtml(node.title)}</strong>${yearStr} (${node.status})\n`;
    if (node.description) {
      html += `    <p>${escapeHtml(node.description)}</p>\n`;
    }
    if (node.children && node.children.length > 0) {
      html += renderNoscriptTree(node.children);
    }
    html += `  </li>\n`;
  }
  html += '</ul>\n';
  return html;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default {
  buildNestedTree,
  wouldCauseCycle,
  renderNoscriptTree,
};
