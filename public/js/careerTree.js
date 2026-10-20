// Interactive SVG Career Trajectory Tree with Horizontal Tidy Layout, Draw Animation & Popovers
export function initCareerTree() {
  const dataScript = document.getElementById('career-data');
  const container = document.getElementById('career-tree-render');
  const tooltip = document.getElementById('career-tooltip');

  if (!dataScript || !container) return;

  let roots;
  try {
    roots = JSON.parse(dataScript.textContent);
  } catch (err) {
    console.error('Failed to parse career-data JSON:', err);
    return;
  }

  if (!Array.isArray(roots) || roots.length === 0) return;

  function renderTree() {
    container.innerHTML = '';
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      renderVerticalMobileTree(roots, container);
    } else {
      renderHorizontalSvgTree(roots, container, tooltip);
    }
  }

  renderTree();
  window.addEventListener('resize', debounce(renderTree, 200));
  window.addEventListener('themechange', () => renderTree());
}

// Horizontal Tidy Tree Renderer for Desktop / Tablet
function renderHorizontalSvgTree(roots, container, tooltip) {
  const NODE_W = 215;
  const NODE_H = 62;
  const GAP_X = 70;
  const GAP_Y = 24;

  const isLight = (document.documentElement.getAttribute('data-theme') || 'dark') === 'light';

  let currentLeafY = 25;

  // Compute leaf-based vertical layout
  function layoutNode(node, depth = 0) {
    node.depth = depth;
    node.x = 25 + depth * (NODE_W + GAP_X);

    if (!node.children || node.children.length === 0) {
      node.y = currentLeafY;
      currentLeafY += NODE_H + GAP_Y;
    } else {
      node.children.forEach((child) => layoutNode(child, depth + 1));
      const firstY = node.children[0].y;
      const lastY = node.children[node.children.length - 1].y;
      node.y = (firstY + lastY) / 2;
    }
  }

  roots.forEach((root) => layoutNode(root, 0));

  let maxDepth = 0;
  function findMaxDepth(node) {
    if (node.depth > maxDepth) maxDepth = node.depth;
    node.children?.forEach(findMaxDepth);
  }
  roots.forEach(findMaxDepth);

  const totalWidth = 50 + (maxDepth + 1) * (NODE_W + GAP_X);
  const totalHeight = Math.max(380, currentLeafY + 30);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
  svg.setAttribute('class', 'career-svg');
  svg.setAttribute('style', `width: 100%; min-width: ${Math.min(totalWidth, 1140)}px; height: ${totalHeight}px;`);

  // Theme-adaptive colors
  const gradDoneColors = isLight
    ? ['#f0fdfa', '#e0f2fe']
    : ['#142634', '#0e1b24'];
  const gradProgColors = isLight
    ? ['#fefce8', '#fffbeb']
    : ['#2a2215', '#14181f'];
  const gradPlanColors = isLight
    ? ['#ffffff', '#f8fafc']
    : ['#111820', '#090d12'];
  const gridLineColor = isLight
    ? 'rgba(15, 23, 42, 0.05)'
    : 'rgba(34, 211, 238, 0.04)';
  const gridDotColor = isLight
    ? 'rgba(15, 23, 42, 0.12)'
    : 'rgba(34, 211, 238, 0.08)';

  // SVG Definitions
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <!-- Neon Cyan Glow Filter -->
    <filter id="nodeGlowCyan" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <!-- Neon Amber Glow Filter -->
    <filter id="nodeGlowAmber" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <!-- Done Node Gradient -->
    <linearGradient id="gradDone" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradDoneColors[0]}" />
      <stop offset="100%" stop-color="${gradDoneColors[1]}" />
    </linearGradient>

    <!-- In-Progress Node Gradient -->
    <linearGradient id="gradProgress" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradProgColors[0]}" />
      <stop offset="100%" stop-color="${gradProgColors[1]}" />
    </linearGradient>

    <!-- Planned Node Gradient -->
    <linearGradient id="gradPlanned" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradPlanColors[0]}" />
      <stop offset="100%" stop-color="${gradPlanColors[1]}" />
    </linearGradient>

    <!-- Background Blueprint Grid Pattern -->
    <pattern id="careerGrid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${gridLineColor}" stroke-width="1" />
      <circle cx="20" cy="0" r="1" fill="${gridDotColor}" />
    </pattern>
  `;
  svg.appendChild(defs);

  // Background Grid Layer
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', 'url(#careerGrid)');
  svg.appendChild(bgRect);

  const edgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  edgesGroup.setAttribute('class', 'career-edges-layer');
  const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  nodesGroup.setAttribute('class', 'career-nodes-layer');
  svg.appendChild(edgesGroup);
  svg.appendChild(nodesGroup);

  // Draw PCB circuit traces
  function drawEdges(node) {
    if (!node.children) return;
    node.children.forEach((child) => {
      const x1 = node.x + NODE_W;
      const y1 = node.y + NODE_H / 2;
      const x2 = child.x;
      const y2 = child.y + NODE_H / 2;
      const midX = (x1 + x2) / 2;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
      path.setAttribute('d', d);
      path.setAttribute('class', `career-edge edge-depth-${child.depth}`);
      path.setAttribute('data-depth', String(child.depth));
      edgesGroup.appendChild(path);

      // Junction solder joint dot
      const joint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      joint.setAttribute('cx', String(x1));
      joint.setAttribute('cy', String(y1));
      joint.setAttribute('r', '3');
      joint.setAttribute('class', 'career-joint-dot');
      joint.setAttribute('fill', node.status === 'done' ? 'var(--accent)' : 'var(--border)');
      edgesGroup.appendChild(joint);

      drawEdges(child);
    });
  }

  roots.forEach(drawEdges);

  // Draw nodes
  function drawNodes(node) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'career-node-group');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', `${node.title} (${node.status})`);
    g.setAttribute('data-depth', String(node.depth));

    // Staged animated entrance
    g.style.opacity = '0';
    g.style.transform = `translate(${node.x - 14}px, ${node.y}px)`;
    g.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';

    // 1. Chip Body
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', String(NODE_W));
    rect.setAttribute('height', String(NODE_H));
    rect.setAttribute('rx', '10');
    rect.setAttribute('class', `career-node-rect node-${node.status}`);

    let strokeColor = isLight ? '#cbd5e1' : 'var(--border)';
    let strokeWidth = '1.5';
    let fillGrad = 'url(#gradPlanned)';

    if (node.status === 'done') {
      strokeColor = 'var(--accent)';
      strokeWidth = '1.8';
      fillGrad = 'url(#gradDone)';
    } else if (node.status === 'in_progress') {
      strokeColor = 'var(--accent-2)';
      strokeWidth = '1.8';
      fillGrad = 'url(#gradProgress)';
      rect.classList.add('node-in-progress');
    } else {
      rect.setAttribute('stroke-dasharray', '5 3');
    }

    rect.setAttribute('fill', fillGrad);
    rect.setAttribute('stroke', strokeColor);
    rect.setAttribute('stroke-width', strokeWidth);
    g.appendChild(rect);

    // 2. Hardware IC Pin Notch on Left
    const notch = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    notch.setAttribute('x', '0');
    notch.setAttribute('y', '12');
    notch.setAttribute('width', '4');
    notch.setAttribute('height', String(NODE_H - 24));
    notch.setAttribute('rx', '2');
    notch.setAttribute('fill', node.status === 'done' ? 'var(--accent)' : (node.status === 'in_progress' ? 'var(--accent-2)' : (isLight ? '#94a3b8' : 'var(--border)')));
    g.appendChild(notch);

    // 3. Status indicator LED Dot
    const statusLed = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    statusLed.setAttribute('cx', '18');
    statusLed.setAttribute('cy', '22');
    statusLed.setAttribute('r', '3.5');
    if (node.status === 'done') {
      statusLed.setAttribute('fill', 'var(--accent)');
      statusLed.setAttribute('filter', 'url(#nodeGlowCyan)');
    } else if (node.status === 'in_progress') {
      statusLed.setAttribute('fill', 'var(--accent-2)');
      statusLed.setAttribute('filter', 'url(#nodeGlowAmber)');
    } else {
      statusLed.setAttribute('fill', isLight ? '#94a3b8' : 'rgba(143, 163, 179, 0.4)');
    }
    g.appendChild(statusLed);

    // 4. Milestone Year Pill Badge (clean tag without awkward "//")
    if (node.target_year) {
      const badgeW = 42;
      const badgeH = 18;
      const badgeX = NODE_W - badgeW - 10;
      const badgeY = 13;

      const badgeBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      badgeBg.setAttribute('x', String(badgeX));
      badgeBg.setAttribute('y', String(badgeY));
      badgeBg.setAttribute('width', String(badgeW));
      badgeBg.setAttribute('height', String(badgeH));
      badgeBg.setAttribute('rx', '4');
      badgeBg.setAttribute('fill', node.status === 'in_progress' 
        ? (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)') 
        : (isLight ? '#e2e8f0' : 'rgba(34, 211, 238, 0.1)'));
      badgeBg.setAttribute('stroke', node.status === 'in_progress' 
        ? (isLight ? '#f59e0b' : 'rgba(245, 158, 11, 0.4)') 
        : (isLight ? '#cbd5e1' : 'rgba(34, 211, 238, 0.25)'));
      badgeBg.setAttribute('stroke-width', '1');
      g.appendChild(badgeBg);

      const yearText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      yearText.setAttribute('x', String(badgeX + badgeW / 2));
      yearText.setAttribute('y', String(badgeY + 13));
      yearText.setAttribute('text-anchor', 'middle');
      yearText.setAttribute('fill', node.status === 'in_progress' 
        ? (isLight ? '#b45309' : 'var(--accent-2)') 
        : (isLight ? '#334155' : 'var(--accent)'));
      yearText.setAttribute('font-size', '10.5');
      yearText.setAttribute('font-family', 'var(--font-mono)');
      yearText.setAttribute('font-weight', '700');
      yearText.textContent = String(node.target_year);
      g.appendChild(yearText);
    }

    // 5. Node Title text (with safe right margin to prevent collision with year pill)
    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', '28');
    titleText.setAttribute('y', '26');
    titleText.setAttribute('fill', isLight ? '#0f172a' : 'var(--text)');
    titleText.setAttribute('font-size', '11.5');
    titleText.setAttribute('font-weight', '600');
    titleText.setAttribute('font-family', 'var(--font-mono)');
    titleText.setAttribute('letter-spacing', '-0.01em');

    const maxChars = node.target_year ? 17 : 22;
    const rawTitle = node.title || 'Milestone';
    titleText.textContent = rawTitle.length > maxChars ? rawTitle.slice(0, maxChars - 1) + '…' : rawTitle;
    g.appendChild(titleText);

    // 6. Subtitle status tag (second row)
    const subText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subText.setAttribute('x', '16');
    subText.setAttribute('y', '47');
    subText.setAttribute('fill', isLight ? '#64748b' : 'var(--text-muted)');
    subText.setAttribute('font-size', '10');
    subText.setAttribute('font-family', 'var(--font-mono)');
    const statusMap = {
      done: '● Achieved & Verified',
      in_progress: '⚡ Active Focus Node',
      planned: '○ Future Roadmap',
    };
    subText.textContent = statusMap[node.status] || 'Roadmap node';
    g.appendChild(subText);

    // Tooltip listeners
    const showTooltip = (evt) => {
      if (!tooltip) return;
      tooltip.innerHTML = `
        <div style="font-weight: 700; color: ${node.status === 'in_progress' ? 'var(--accent-2)' : 'var(--accent)'}; margin-bottom: 4px; font-family: var(--font-mono); font-size: 13px;">${escapeHtml(node.title)}</div>
        <div style="font-size: 11px; margin-bottom: 6px; color: ${isLight ? '#64748b' : 'var(--text-muted)'}; font-family: var(--font-mono);">Status: <span style="text-transform: capitalize; color: ${isLight ? '#0f172a' : 'var(--text)'}; font-weight: 600;">${node.status.replace('_', ' ')}</span>${node.target_year ? ` | Target: ${node.target_year}` : ''}</div>
        <div style="font-size: 12px; line-height: 1.5; color: ${isLight ? '#334155' : '#cbd5e1'};">${escapeHtml(node.description || 'Key technical competency on career architecture.')}</div>
      `;
      tooltip.style.display = 'block';

      const rectBounds = g.getBoundingClientRect();
      const containerBounds = container.getBoundingClientRect();
      let left = rectBounds.left - containerBounds.left;
      let top = rectBounds.top - containerBounds.top + NODE_H + 10;

      if (left + 280 > containerBounds.width) {
        left = Math.max(10, containerBounds.width - 290);
      }
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };

    const hideTooltip = () => {
      if (tooltip) tooltip.style.display = 'none';
    };

    g.addEventListener('mouseenter', showTooltip);
    g.addEventListener('mouseleave', hideTooltip);
    g.addEventListener('focus', showTooltip);
    g.addEventListener('blur', hideTooltip);

    nodesGroup.appendChild(g);
    node.children?.forEach(drawNodes);
  }

  roots.forEach(drawNodes);
  container.appendChild(svg);

  // Trigger animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateGraph(edgesGroup, nodesGroup);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  observer.observe(container);
}

// Staggered animated reveal of edges and nodes
function animateGraph(edgesGroup, nodesGroup) {
  // 1. Animate edges drawing outward
  const paths = edgesGroup.querySelectorAll('.career-edge');
  paths.forEach((path) => {
    const len = path.getTotalLength ? path.getTotalLength() : 300;
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    const depth = Number(path.getAttribute('data-depth')) || 1;

    setTimeout(() => {
      path.style.transition = 'stroke-dashoffset 0.7s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease';
      path.style.strokeDashoffset = '0';
      path.classList.add('drawn');
    }, depth * 140);
  });

  // 2. Animate nodes sliding and fading in along hierarchy
  const nodeGroups = nodesGroup.querySelectorAll('.career-node-group');
  nodeGroups.forEach((g) => {
    const depth = Number(g.getAttribute('data-depth')) || 0;
    const currentTransform = g.style.transform;
    const match = currentTransform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
    
    if (match) {
      const origX = parseFloat(match[1]) + 14;
      const origY = parseFloat(match[2]);

      setTimeout(() => {
        g.style.opacity = '1';
        g.style.transform = `translate(${origX}px, ${origY}px)`;
      }, depth * 160 + 80);
    } else {
      g.style.opacity = '1';
    }
  });
}

// Mobile Vertical Indented Tree
function renderVerticalMobileTree(roots, container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'career-mobile-tree';

  function buildList(nodes) {
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.paddingLeft = '18px';
    ul.style.borderLeft = '2px dashed var(--border)';
    ul.style.marginTop = '8px';

    nodes.forEach((node) => {
      const li = document.createElement('li');
      li.style.marginBottom = '12px';

      const badgeColor = node.status === 'done' ? 'var(--accent)' : (node.status === 'in_progress' ? 'var(--accent-2)' : 'var(--text-muted)');

      li.innerHTML = `
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-family: var(--font-mono); font-size: 14px; color: ${badgeColor};">${escapeHtml(node.title)}</strong>
            <span style="font-size: 11px; font-family: var(--font-mono); color: var(--text-muted);">${node.target_year || ''}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">${escapeHtml(node.description || '')}</div>
        </div>
      `;

      if (node.children && node.children.length > 0) {
        li.appendChild(buildList(node.children));
      }
      ul.appendChild(li);
    });

    return ul;
  }

  wrapper.appendChild(buildList(roots));
  container.appendChild(wrapper);
}

function debounce(fn, wait) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
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
