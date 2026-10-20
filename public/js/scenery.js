/**
 * Cybernetic Scenery Canvas Animation
 * 
 * Renders an animated futuristic background landscape:
 * 1. Deep space atmosphere with twinkling digital signal nodes & constellation mesh.
 * 2. Multi-layered mountain horizon ridges with neon vector crests and wireframe contours.
 * 3. Perspective 3D cyber-grid terrain plane with forward-moving scroll & traveling data pulses.
 * 4. Silky smooth parallax responding to cursor tracking and vertical page scrolling.
 * 5. Dynamic theme switching (Dark Obsidian Neon <-> Light Engineering Blueprint).
 * 6. Optimized via requestAnimationFrame, delta-time smoothing, and visibility-change pausing.
 */

export function initScenery() {
  const canvas = document.getElementById('bg-scenery-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  // Animation and viewport state
  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationFrameId = null;
  let isRunning = false;

  // Parallax & smooth interpolation
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let targetMouseX = mouseX;
  let targetMouseY = mouseY;
  let scrollY = window.scrollY || 0;
  let targetScrollY = scrollY;

  // Scenery parameters
  let gridOffset = 0;
  const gridSpeed = 0.007; // speed of moving perspective grid
  const pulseTracks = [
    { lineIdx: 4, z: 0.1, speed: 0.008, color: 'accent' },
    { lineIdx: 8, z: 0.5, speed: 0.012, color: 'accent-2' },
    { lineIdx: 12, z: 0.3, speed: 0.010, color: 'accent' },
    { lineIdx: 16, z: 0.8, speed: 0.014, color: 'accent-2' },
    { lineIdx: 20, z: 0.2, speed: 0.009, color: 'accent' },
  ];

  // Floating signal/star particles
  const particleCount = 70;
  const particles = [];

  function createParticles() {
    particles.length = 0;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * (width || window.innerWidth),
        y: Math.random() * ((height || window.innerHeight) * 0.7),
        baseX: 0,
        baseY: 0,
        size: Math.random() * 2 + 0.8,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: -Math.random() * 0.35 - 0.1,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        colorType: Math.random() > 0.3 ? 'accent' : 'accent-2'
      });
    }
  }

  // Resize handler with High-DPI support
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    if (particles.length === 0) {
      createParticles();
    } else {
      particles.forEach((p) => {
        if (p.x > width) p.x = Math.random() * width;
        if (p.y > height * 0.75) p.y = Math.random() * (height * 0.75);
      });
    }
  }

  // Mountain height generators using harmonic trigonometric functions
  function getMountainLayer1(x, w) {
    // Distant jagged peaks
    const nx = x / w;
    return (
      Math.sin(nx * 3.5 + 1.2) * 65 +
      Math.cos(nx * 7.5 - 0.8) * 35 +
      Math.sin(nx * 15.0 + 2.0) * 18 +
      Math.cos(nx * 30.0) * 8
    );
  }

  function getMountainLayer2(x, w) {
    // Midground cyber ridges
    const nx = x / w;
    return (
      Math.sin(nx * 5.0 - 0.5) * 50 +
      Math.cos(nx * 11.0 + 1.6) * 28 +
      Math.sin(nx * 22.0 - 1.2) * 12
    );
  }

  function getMountainLayer3(x, w) {
    // Near foothills / silicon plateaus
    const nx = x / w;
    return (
      Math.sin(nx * 4.2 + 2.8) * 40 +
      Math.cos(nx * 9.2 + 0.5) * 22 +
      Math.sin(nx * 18.5 + 1.0) * 10
    );
  }

  // Color palette resolver based on active theme
  function getPalette() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    if (isLight) {
      return {
        isLight: true,
        skyTop: 'rgba(248, 250, 252, 0.98)',
        skyBottom: 'rgba(226, 232, 240, 0.85)',
        m1Fill: 'rgba(219, 234, 254, 0.45)',
        m1Stroke: 'rgba(14, 116, 144, 0.4)',
        m2Fill: 'rgba(207, 250, 254, 0.5)',
        m2Stroke: 'rgba(8, 145, 178, 0.6)',
        m2Grid: 'rgba(8, 145, 178, 0.12)',
        m3Fill: 'rgba(254, 243, 199, 0.4)',
        m3Stroke: 'rgba(217, 119, 6, 0.65)',
        m3Grid: 'rgba(217, 119, 6, 0.14)',
        horizonGlow: 'rgba(14, 116, 144, 0.25)',
        gridPlaneFill: 'rgba(241, 245, 249, 0.88)',
        gridLine: 'rgba(8, 145, 178, 0.18)',
        pulseAccent: 'rgba(14, 116, 144, 0.8)',
        pulseAccent2: 'rgba(217, 119, 6, 0.9)',
        starAccent: 'rgba(8, 145, 178, 0.7)',
        starAccent2: 'rgba(217, 119, 6, 0.75)',
        constellationLine: 'rgba(8, 145, 178, 0.08)'
      };
    }

    // Default: Cyber PCB Dark Mode
    return {
      isLight: false,
      skyTop: 'rgba(8, 14, 20, 0.96)',
      skyBottom: 'rgba(11, 24, 36, 0.88)',
      m1Fill: 'rgba(11, 20, 30, 0.75)',
      m1Stroke: 'rgba(34, 211, 238, 0.35)',
      m2Fill: 'rgba(13, 27, 40, 0.85)',
      m2Stroke: 'rgba(34, 211, 238, 0.7)',
      m2Grid: 'rgba(34, 211, 238, 0.15)',
      m3Fill: 'rgba(17, 33, 48, 0.92)',
      m3Stroke: 'rgba(245, 158, 11, 0.75)',
      m3Grid: 'rgba(245, 158, 11, 0.16)',
      horizonGlow: 'rgba(34, 211, 238, 0.35)',
      gridPlaneFill: 'rgba(7, 13, 19, 0.94)',
      gridLine: 'rgba(34, 211, 238, 0.22)',
      pulseAccent: 'rgba(34, 211, 238, 0.95)',
      pulseAccent2: 'rgba(245, 158, 11, 0.95)',
      starAccent: 'rgba(34, 211, 238, 0.8)',
      starAccent2: 'rgba(245, 158, 11, 0.85)',
      constellationLine: 'rgba(34, 211, 238, 0.12)'
    };
  }

  // Draw Mountain Range with wireframe contours
  function drawMountainLayer(getYFunc, baseHorizonY, fillStyle, strokeStyle, gridStyle, gridStep, parallaxRatio) {
    const pShiftX = (mouseX - width / 2) * parallaxRatio;
    const pShiftY = Math.min((scrollY * 0.1) * parallaxRatio, 50);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-100, height);

    const step = 8;
    for (let x = -100; x <= width + 100; x += step) {
      const peakY = baseHorizonY - pShiftY - getYFunc(x + pShiftX, width);
      ctx.lineTo(x, peakY);
    }

    ctx.lineTo(width + 100, height);
    ctx.closePath();

    ctx.fillStyle = fillStyle;
    ctx.fill();

    // Crest Stroke
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();

    // Wireframe vertical digital contours
    if (gridStyle && gridStep > 0) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = gridStyle;
      ctx.beginPath();
      for (let x = 0; x <= width; x += gridStep) {
        const peakY = baseHorizonY - pShiftY - getYFunc(x + pShiftX, width);
        ctx.moveTo(x, peakY);
        ctx.lineTo(x, baseHorizonY + 30);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw Perspective Cyber-Grid Terrain
  function drawPerspectiveGrid(horizonY, palette) {
    const vanishX = width * 0.5 + (mouseX - width * 0.5) * 0.08;
    const gridBottom = height;
    const gridHeight = gridBottom - horizonY;
    if (gridHeight <= 10) return;

    ctx.save();

    // Base surface fill below horizon
    ctx.fillStyle = palette.gridPlaneFill;
    ctx.fillRect(0, horizonY, width, gridHeight);

    // 1. Longitudinal radiating perspective lines
    const numLongLines = 26;
    ctx.strokeStyle = palette.gridLine;
    ctx.lineWidth = 1.2;
    ctx.beginPath();

    const longLinesX = [];
    for (let i = 0; i <= numLongLines; i++) {
      const norm = (i / numLongLines) * 2 - 1; // -1 to +1
      // Non-linear horizontal spread at bottom for wide perspective angle
      const bottomX = vanishX + norm * (width * 0.95);
      ctx.moveTo(vanishX, horizonY);
      ctx.lineTo(bottomX, gridBottom);
      longLinesX.push({ norm, bottomX });
    }
    ctx.stroke();

    // 2. Transverse scrolling perspective lines
    const numLatLines = 18;
    for (let i = 0; i < numLatLines; i++) {
      // Perspective progression: z in (0, 1) mapped with power curve
      const z = (i + gridOffset) / numLatLines;
      const frac = (z % 1);
      const curveY = horizonY + Math.pow(frac, 2.4) * gridHeight;
      const alpha = Math.min(Math.pow(frac, 1.2), 1) * (palette.isLight ? 0.35 : 0.6);

      ctx.strokeStyle = palette.isLight 
        ? `rgba(8, 145, 178, ${alpha * 0.4})` 
        : `rgba(34, 211, 238, ${alpha * 0.5})`;
      ctx.lineWidth = 1 + frac * 1.5;

      ctx.beginPath();
      ctx.moveTo(0, curveY);
      ctx.lineTo(width, curveY);
      ctx.stroke();
    }

    // 3. Traveling Signal Packets on Longitudinal Lines
    pulseTracks.forEach((track) => {
      track.z += track.speed;
      if (track.z > 1) track.z = 0;

      const frac = track.z;
      const pulseY = horizonY + Math.pow(frac, 2.4) * gridHeight;
      const longLine = longLinesX[track.lineIdx];
      if (!longLine) return;

      const pulseX = vanishX + (longLine.bottomX - vanishX) * Math.pow(frac, 1.4);
      const pulseSize = 2 + frac * 4;

      ctx.beginPath();
      ctx.arc(pulseX, pulseY, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = track.color === 'accent' ? palette.pulseAccent : palette.pulseAccent2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = track.color === 'accent' ? '#22d3ee' : '#f59e0b';
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 4. Radiant Horizon Line Glow
    const glowGrad = ctx.createRadialGradient(
      vanishX, horizonY, 2,
      vanishX, horizonY, width * 0.6
    );
    glowGrad.addColorStop(0, palette.horizonGlow);
    glowGrad.addColorStop(0.5, 'rgba(34, 211, 238, 0.08)');
    glowGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, horizonY - 40, width, 80);

    // Sharp glowing horizon beam
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(width, horizonY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = palette.isLight ? 'rgba(8, 145, 178, 0.5)' : 'rgba(34, 211, 238, 0.8)';
    ctx.stroke();

    ctx.restore();
  }

  // Draw Twinkling Signal Nodes & Constellation Mesh
  function drawParticles(palette) {
    const maxDist = 95;
    ctx.save();

    // Move & draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap around top/bottom/sides
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height * 0.72;
      if (p.y > height * 0.72) p.y = 0;

      // Twinkle
      p.alpha += p.twinkleSpeed;
      if (p.alpha > 0.95 || p.alpha < 0.2) p.twinkleSpeed = -p.twinkleSpeed;

      const pAlpha = Math.max(0.1, Math.min(p.alpha, 1));
      ctx.fillStyle = p.colorType === 'accent' ? palette.starAccent : palette.starAccent2;
      ctx.globalAlpha = pAlpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Connect nearby particles with subtle circuit laser threads
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const lineAlpha = (1 - dist / maxDist) * 0.22;
          ctx.strokeStyle = palette.constellationLine;
          ctx.globalAlpha = lineAlpha;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  // Main Render Loop
  function render() {
    if (!isRunning) return;

    // Smooth lerping of cursor and scroll offsets
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;
    scrollY += (targetScrollY - scrollY) * 0.08;

    // Advance perspective grid
    gridOffset = (gridOffset + gridSpeed) % 1;

    ctx.clearRect(0, 0, width, height);

    const palette = getPalette();

    // 1. Sky Gradient Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, palette.skyTop);
    skyGrad.addColorStop(0.7, palette.skyBottom);
    skyGrad.addColorStop(1, palette.gridPlaneFill);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Stars & Signal Constellation in Celestial Sky
    drawParticles(palette);

    // 3. Horizon line vertical anchor (68% down screen with slight scroll parallax)
    const baseHorizonY = height * 0.70 + Math.min(scrollY * 0.04, 60);

    // 4. Mountain Layers
    // Layer 1: Distant Cyber Peaks (slow parallax: 0.015)
    drawMountainLayer(getMountainLayer1, baseHorizonY, palette.m1Fill, palette.m1Stroke, null, 0, 0.015);

    // Layer 2: Midground Mountain Ridge with Wireframe Contours (medium parallax: 0.035)
    drawMountainLayer(getMountainLayer2, baseHorizonY + 15, palette.m2Fill, palette.m2Stroke, palette.m2Grid, 38, 0.035);

    // Layer 3: Near Ridge & Silicon Foothills (foreground parallax: 0.065)
    drawMountainLayer(getMountainLayer3, baseHorizonY + 30, palette.m3Fill, palette.m3Stroke, palette.m3Grid, 24, 0.065);

    // 5. 3D Perspective Cyber Terrain Grid Plane
    drawPerspectiveGrid(baseHorizonY + 30, palette);

    animationFrameId = requestAnimationFrame(render);
  }

  // Event Listeners
  window.addEventListener('resize', resize, { passive: true });

  window.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY || 0;
  }, { passive: true });

  // Pause rendering when tab is hidden to save energy
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isRunning = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    } else {
      if (!isRunning) {
        isRunning = true;
        render();
      }
    }
  });

  // Respect prefers-reduced-motion
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQuery.matches) {
    resize();
    // Render single frame without continuous loop
    isRunning = false;
    render();
    return;
  }

  resize();
  isRunning = true;
  render();
}
