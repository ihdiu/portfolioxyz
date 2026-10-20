// Circuit Background Traces & Traveling Signal Pulses
export function initCircuit() {
  const container = document.getElementById('hero-circuit');
  if (!container) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 1440 900`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('style', 'width: 100%; height: 100%; position: absolute; top:0; left:0;');

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="traceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.3" />
      <stop offset="100%" stop-color="var(--accent-2)" stop-opacity="0.1" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  `;
  svg.appendChild(defs);

  // PCB trace paths with 90-degree orthogonal bends and circular pads
  const pathsData = [
    "M 0 180 H 350 L 450 280 H 750 L 850 180 H 1440",
    "M 1440 450 H 1100 L 980 330 H 600 L 480 450 H 0",
    "M 200 0 V 150 L 320 270 V 600 L 420 700 H 1000",
    "M 1200 900 V 750 L 1080 630 V 420 L 950 290 H 800",
    "M 0 720 H 260 L 380 600 H 820 L 940 720 H 1440"
  ];

  const pads = [
    { cx: 350, cy: 180 },
    { cx: 750, cy: 280 },
    { cx: 1100, cy: 450 },
    { cx: 600, cy: 330 },
    { cx: 320, cy: 270 },
    { cx: 1080, cy: 630 },
    { cx: 260, cy: 720 },
    { cx: 820, cy: 600 }
  ];

  // Render static traces
  pathsData.forEach((d) => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    p.setAttribute('stroke', 'var(--border)');
    p.setAttribute('stroke-width', '1.5');
    p.setAttribute('fill', 'none');
    svg.appendChild(p);
  });

  // Render pads (via points)
  pads.forEach((pt) => {
    const pad = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pad.setAttribute('cx', String(pt.cx));
    pad.setAttribute('cy', String(pt.cy));
    pad.setAttribute('r', '4');
    pad.setAttribute('fill', 'var(--surface)');
    pad.setAttribute('stroke', 'var(--accent)');
    pad.setAttribute('stroke-width', '1.5');
    svg.appendChild(pad);
  });

  // Animated traveling signal pulses
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionOff = document.documentElement.getAttribute('data-motion') === 'off';

  if (!prefersReduced && !motionOff) {
    pathsData.slice(0, 3).forEach((d, idx) => {
      const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pulse.setAttribute('d', d);
      pulse.setAttribute('stroke', idx % 2 === 0 ? 'var(--accent)' : 'var(--accent-2)');
      pulse.setAttribute('stroke-width', '2.5');
      pulse.setAttribute('fill', 'none');
      pulse.setAttribute('class', 'pulse-path');
      pulse.setAttribute('filter', 'url(#glow)');
      pulse.style.animationDelay = `${idx * 2}s`;
      svg.appendChild(pulse);
    });
  }

  container.appendChild(svg);
}
