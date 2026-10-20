import { Router } from 'express';
import {
  getAllNodes,
  getNodeById,
  createNode,
  updateNode,
  deleteNode,
} from '../../repositories/careerNodes.js';
import { buildNestedTree } from '../../services/careerTree.js';
import { generateCsrfToken, doubleCsrfProtection } from '../../middleware/csrf.js';

const router = Router();
router.use(doubleCsrfProtection);

function flattenTreeForIndentation(nodes, depth = 0, result = []) {
  for (const node of nodes) {
    result.push({ ...node, depth });
    if (node.children && node.children.length > 0) {
      flattenTreeForIndentation(node.children, depth + 1, result);
    }
  }
  return result;
}

router.get('/', async (req, res, next) => {
  try {
    const rawNodes = await getAllNodes();
    const tree = buildNestedTree(rawNodes);
    const indentedNodes = flattenTreeForIndentation(tree);

    res.render('admin/career', {
      title: 'Career Path Tree Editor',
      nodes: indentedNodes,
      allNodes: rawNodes,
      flash: req.session.flash || null,
      csrfToken: generateCsrfToken(req, res),
    });
    delete req.session.flash;
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, parent_id, status, target_year, sort_order } = req.body;
    if (!title || title.trim().length === 0) {
      req.session.flash = { type: 'error', message: 'Title is required.' };
      return res.redirect('/admin/career');
    }

    await createNode({
      title: title.trim(),
      description: description || null,
      parent_id: parent_id ? Number(parent_id) : null,
      status: status || 'planned',
      target_year: target_year ? Number(target_year) : null,
      sort_order: Number(sort_order) || 0,
    });

    req.session.flash = { type: 'success', message: 'Career node added.' };
    res.redirect('/admin/career');
  } catch (err) {
    next(err);
  }
});

router.post('/:id', async (req, res, next) => {
  try {
    const { title, description, parent_id, status, target_year, sort_order } = req.body;
    await updateNode(req.params.id, {
      title: title.trim(),
      description: description || null,
      parent_id: parent_id ? Number(parent_id) : null,
      status: status || 'planned',
      target_year: target_year ? Number(target_year) : null,
      sort_order: Number(sort_order) || 0,
    });

    req.session.flash = { type: 'success', message: 'Career node updated.' };
    res.redirect('/admin/career');
  } catch (err) {
    // Catch cycle prevention error
    req.session.flash = { type: 'error', message: err.message };
    res.redirect('/admin/career');
  }
});

router.post('/:id/delete', async (req, res, next) => {
  try {
    await deleteNode(req.params.id);
    req.session.flash = { type: 'success', message: 'Career node and its subtree deleted.' };
    res.redirect('/admin/career');
  } catch (err) {
    next(err);
  }
});

export default router;
