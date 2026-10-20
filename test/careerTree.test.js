import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildNestedTree, wouldCauseCycle, renderNoscriptTree } from '../src/services/careerTree.js';

describe('Career Tree Service', () => {
  const sampleNodes = [
    { id: 1, parent_id: null, title: 'Foundation', status: 'done', sort_order: 1 },
    { id: 2, parent_id: 1, title: 'Embedded Systems', status: 'done', sort_order: 1 },
    { id: 3, parent_id: 1, title: 'Distributed Systems', status: 'in_progress', sort_order: 2 },
    { id: 4, parent_id: 2, title: 'PCB Design', status: 'planned', sort_order: 1 },
  ];

  test('buildNestedTree nests flat nodes into hierarchy', () => {
    const tree = buildNestedTree(sampleNodes);
    assert.equal(tree.length, 1);
    assert.equal(tree[0].id, 1);
    assert.equal(tree[0].children.length, 2);
    assert.equal(tree[0].children[0].id, 2);
    assert.equal(tree[0].children[0].children.length, 1);
    assert.equal(tree[0].children[0].children[0].id, 4);
    assert.equal(tree[0].children[1].id, 3);
  });

  test('wouldCauseCycle detects direct and indirect cycles', () => {
    // Direct cycle: node 1 parent of itself
    assert.equal(wouldCauseCycle(sampleNodes, 1, 1), true);

    // Indirect cycle: making node 1 a child of node 4 (which is a descendant of 1)
    assert.equal(wouldCauseCycle(sampleNodes, 1, 4), true);

    // Non-cycle: making node 3 a child of node 2
    assert.equal(wouldCauseCycle(sampleNodes, 3, 2), false);

    // Non-cycle: root node (parent null)
    assert.equal(wouldCauseCycle(sampleNodes, 2, null), false);
  });

  test('renderNoscriptTree generates valid HTML list', () => {
    const tree = buildNestedTree(sampleNodes);
    const html = renderNoscriptTree(tree);
    assert.match(html, /<ul class="career-tree-noscript-list">/);
    assert.match(html, /Foundation/);
    assert.match(html, /Embedded Systems/);
    assert.match(html, /PCB Design/);
  });
});
