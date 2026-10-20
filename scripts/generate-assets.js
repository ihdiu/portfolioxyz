import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const imgDir = path.resolve('public/img');
const uploadsDir = path.resolve('uploads');

await fs.mkdir(imgDir, { recursive: true });
await fs.mkdir(uploadsDir, { recursive: true });

async function createSvgImage(svg, outputPath, format = 'png') {
  const buffer = Buffer.from(svg);
  if (format === 'jpg' || format === 'jpeg') {
    await sharp(buffer).jpeg({ quality: 90 }).toFile(outputPath);
  } else {
    await sharp(buffer).png().toFile(outputPath);
  }
  console.log(`Generated: ${outputPath}`);
}

// 1. Avatar
const avatarSvg = `
<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#1e3448" />
      <stop offset="100%" stop-color="#070c10" />
    </radialGradient>
    <linearGradient id="cyber" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)" />
  <circle cx="200" cy="200" r="180" fill="none" stroke="url(#cyber)" stroke-width="4" stroke-dasharray="10 6" />
  <circle cx="200" cy="160" r="60" fill="#22d3ee" opacity="0.8" />
  <path d="M 100 330 C 100 240, 300 240, 300 330 Z" fill="#22d3ee" opacity="0.6" />
  <circle cx="180" cy="150" r="8" fill="#070c10" />
  <circle cx="220" cy="150" r="8" fill="#070c10" />
  <path d="M 180 180 Q 200 195, 220 180" stroke="#070c10" stroke-width="4" fill="none" stroke-linecap="round" />
  <text x="200" y="375" text-anchor="middle" font-family="monospace" font-size="14" fill="#22d3ee" letter-spacing="3">SYS.USER_ACTIVE</text>
</svg>`;

// 2. Telemetry Project
const telemetrySvg = `
<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#091219" />
  <path d="M 50 225 Q 120 100, 200 225 T 350 225 T 500 225 T 650 225 T 750 225" fill="none" stroke="#22d3ee" stroke-width="3" />
  <path d="M 50 225 Q 150 320, 250 225 T 450 225 T 650 225" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="8 4" opacity="0.7" />
  <circle cx="200" cy="225" r="6" fill="#22d3ee" />
  <circle cx="350" cy="225" r="6" fill="#f59e0b" />
  <circle cx="500" cy="225" r="6" fill="#22d3ee" />
  <text x="50" y="60" font-family="monospace" font-size="20" font-weight="bold" fill="#22d3ee">EDGE_TELEMETRY // STREAM_BUS</text>
  <text x="50" y="90" font-family="monospace" font-size="14" fill="#8fa3b3">15,000 samples/sec &#8226; Real-Time Socket Stream</text>
  <line x1="50" y1="380" x2="750" y2="380" stroke="#22313d" stroke-width="2" />
  <line x1="50" y1="400" x2="450" y2="400" stroke="#22d3ee" stroke-width="4" />
</svg>`;

// 3. Microkernel Project
const kernelSvg = `
<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#0d1117" />
  <rect x="50" y="50" width="700" height="350" rx="8" fill="#161b22" stroke="#30363d" stroke-width="2" />
  <text x="80" y="100" font-family="monospace" font-size="16" fill="#f59e0b">#include &lt;scheduler.h&gt;</text>
  <text x="80" y="140" font-family="monospace" font-size="15" fill="#22d3ee">void SysTick_Handler(void) {</text>
  <text x="110" y="175" font-family="monospace" font-size="15" fill="#8fa3b3">  task_t *next = sched_get_highest_priority();</text>
  <text x="110" y="210" font-family="monospace" font-size="15" fill="#8fa3b3">  context_switch_pend(next);</text>
  <text x="80" y="245" font-family="monospace" font-size="15" fill="#22d3ee">}</text>
  <rect x="80" y="290" width="200" height="60" rx="6" fill="#21262d" stroke="#22d3ee" stroke-width="1.5" />
  <text x="100" y="325" font-family="monospace" font-size="13" fill="#22d3ee">RAM Footprint &lt; 4KB</text>
</svg>`;

// 4. ECG Hardware Project
const ecgSvg = `
<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#06120e" />
  <path d="M 0 225 H 250 L 270 200 L 290 280 L 320 110 L 350 320 L 370 225 L 390 240 L 410 225 H 800" fill="none" stroke="#34d399" stroke-width="3" />
  <circle cx="320" cy="110" r="5" fill="#34d399" />
  <circle cx="350" cy="320" r="5" fill="#34d399" />
  <text x="60" y="70" font-family="monospace" font-size="20" font-weight="bold" fill="#34d399">BIO-POTENTIAL // 24-BIT ADC</text>
  <text x="60" y="100" font-family="monospace" font-size="14" fill="#8fa3b3">CMRR &gt; 110 dB &#8226; Ultra-Low Noise Analog Front-End</text>
</svg>`;

// 5. Mesh Repeater Project
const meshSvg = `
<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#0d141c" />
  <circle cx="400" cy="225" r="80" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="8 6" />
  <circle cx="400" cy="225" r="140" fill="none" stroke="#22d3ee" stroke-width="1.5" stroke-dasharray="12 8" />
  <circle cx="400" cy="225" r="200" fill="none" stroke="#30363d" stroke-width="1" />
  <circle cx="400" cy="225" r="12" fill="#f59e0b" />
  <text x="50" y="70" font-family="monospace" font-size="20" font-weight="bold" fill="#f59e0b">SUB-GHz LORA // MESH REPEATER</text>
  <text x="50" y="100" font-family="monospace" font-size="14" fill="#8fa3b3">Solar-Harvesting MPPT &#8226; 915 MHz Mesh Grid</text>
</svg>`;

// 6. OG Image
const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0f14" />
  <path d="M 0 315 H 400 L 500 200 H 800 L 900 315 H 1200" fill="none" stroke="#22313d" stroke-width="3" />
  <path d="M 200 0 V 200 L 350 350 H 850 L 1000 500 V 630" fill="none" stroke="#22d3ee" stroke-width="3" opacity="0.5" />
  <circle cx="500" cy="200" r="8" fill="#22d3ee" />
  <circle cx="800" cy="200" r="8" fill="#f59e0b" />
  <text x="100" y="280" font-family="monospace" font-size="48" font-weight="900" fill="#e6edf3">PORTFOLIO // SYSTEM</text>
  <text x="100" y="340" font-family="monospace" font-size="26" fill="#22d3ee">Computer Science &amp; Electronics Engineering</text>
  <text x="100" y="390" font-family="monospace" font-size="18" fill="#8fa3b3">Firmware &#8226; Mixed-Signal Hardware &#8226; Distributed Web Platforms</text>
</svg>`;

await createSvgImage(avatarSvg, path.join(imgDir, 'avatar.png'), 'png');
await createSvgImage(telemetrySvg, path.join(imgDir, 'proj-telemetry.jpg'), 'jpg');
await createSvgImage(kernelSvg, path.join(imgDir, 'proj-kernel.jpg'), 'jpg');
await createSvgImage(ecgSvg, path.join(imgDir, 'proj-ecg.jpg'), 'jpg');
await createSvgImage(meshSvg, path.join(imgDir, 'proj-mesh.jpg'), 'jpg');
await createSvgImage(ogSvg, path.join(imgDir, 'og-preview.png'), 'png');

// Create dummy valid PDF file for resume
const samplePdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 55 >> stream
BT /F1 18 Tf 50 720 Td (Computer Science & Electronics Resume) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000212 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
318
%%EOF`;

await fs.writeFile(path.join(uploadsDir, 'resume.pdf'), samplePdf);
console.log('Generated: uploads/resume.pdf');
