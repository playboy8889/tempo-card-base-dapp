import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");

const W = 1284;
const H = 2778;

const colors = {
  bg: "#050816",
  panel: "#0f1428",
  panel2: "#11172f",
  line: "#2a355f",
  white: "#f5f7ff",
  soft: "#a8b7e6",
  cyan: "#82e8ff",
  mint: "#7ef7bd",
  gold: "#ffd36d",
  pink: "#ff7d9d",
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const result = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      result.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) result.push(current);
  return result;
}

function frame(content) {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0.04)"/>
      </linearGradient>
      <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${colors.cyan}"/>
        <stop offset="40%" stop-color="${colors.mint}"/>
        <stop offset="70%" stop-color="${colors.gold}"/>
        <stop offset="100%" stop-color="${colors.pink}"/>
      </linearGradient>
      <radialGradient id="glowA" cx="0.2" cy="0.1" r="1">
        <stop offset="0%" stop-color="rgba(130,232,255,0.36)"/>
        <stop offset="100%" stop-color="rgba(130,232,255,0)"/>
      </radialGradient>
      <radialGradient id="glowB" cx="0.8" cy="0.18" r="1">
        <stop offset="0%" stop-color="rgba(255,125,157,0.24)"/>
        <stop offset="100%" stop-color="rgba(255,125,157,0)"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${colors.bg}"/>
    <rect width="${W}" height="${H}" fill="url(#glowA)"/>
    <rect width="${W}" height="${H}" fill="url(#glowB)"/>
    ${content}
  </svg>`;
}

function header(title, subtitle) {
  const lines = wrap(subtitle, 40);
  return `
    <rect x="54" y="54" width="1176" height="260" rx="40" fill="url(#glass)" stroke="rgba(255,255,255,0.16)" stroke-width="4"/>
    <text x="92" y="122" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="${colors.soft}">TEMPO CARD</text>
    <text x="92" y="204" font-family="Arial, sans-serif" font-size="76" font-weight="900" fill="${colors.white}">${esc(title)}</text>
    ${lines.map((line, index) => `<text x="96" y="${252 + index * 34}" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${colors.soft}">${esc(line)}</text>`).join("")}
  `;
}

function glassCard(x, y, width, height, title, lines, accent = colors.cyan) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="30" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="4"/>
      <text x="${x + 24}" y="${y + 48}" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="${accent}">${esc(title)}</text>
      ${lines.map((line, index) => `<text x="${x + 24}" y="${y + 104 + index * 38}" font-family="Arial, sans-serif" font-size="${index === 0 ? 34 : 28}" font-weight="${index === 0 ? 900 : 700}" fill="${index === 0 ? colors.white : colors.soft}">${esc(line)}</text>`).join("")}
    </g>
  `;
}

function playerCard(x, y, title, mood, bpm, energy, note) {
  const wrapped = wrap(note, 44);
  return `
    <g>
      <rect x="${x}" y="${y}" width="1140" height="920" rx="36" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)" stroke-width="4"/>
      <rect x="${x + 34}" y="${y + 34}" width="1072" height="852" rx="30" fill="rgba(5,8,22,0.72)"/>
      <circle cx="${x + 920}" cy="${y + 158}" r="70" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" stroke-width="4"/>
      <circle cx="${x + 920}" cy="${y + 158}" r="34" fill="none" stroke="${colors.cyan}" stroke-width="12"/>
      <text x="${x + 60}" y="${y + 116}" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="${colors.soft}">LIVE CARD</text>
      <text x="${x + 60}" y="${y + 220}" font-family="Arial, sans-serif" font-size="82" font-weight="900" fill="${colors.white}">${esc(title)}</text>
      <text x="${x + 60}" y="${y + 286}" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="${colors.soft}">${esc(mood)}</text>

      <rect x="${x + 60}" y="${y + 340}" width="300" height="164" rx="24" fill="rgba(255,255,255,0.06)"/>
      <rect x="${x + 390}" y="${y + 340}" width="300" height="164" rx="24" fill="rgba(255,255,255,0.06)"/>
      <rect x="${x + 720}" y="${y + 340}" width="326" height="164" rx="24" fill="rgba(255,255,255,0.06)"/>
      <text x="${x + 84}" y="${y + 392}" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="${colors.soft}">BPM</text>
      <text x="${x + 84}" y="${y + 466}" font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="${colors.white}">${bpm}</text>
      <text x="${x + 414}" y="${y + 392}" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="${colors.soft}">ENERGY</text>
      <text x="${x + 414}" y="${y + 466}" font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="${colors.white}">${energy}/5</text>
      <text x="${x + 744}" y="${y + 392}" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="${colors.soft}">LEVEL</text>
      <text x="${x + 744}" y="${y + 466}" font-family="Arial, sans-serif" font-size="46" font-weight="900" fill="${colors.white}">afterglow</text>

      <rect x="${x + 60}" y="${y + 558}" width="986" height="18" rx="9" fill="rgba(255,255,255,0.08)"/>
      <rect x="${x + 60}" y="${y + 558}" width="${Math.round((986 * energy) / 5)}" height="18" rx="9" fill="url(#bar)"/>
      ${wrapped.map((line, index) => `<text x="${x + 60}" y="${y + 664 + index * 42}" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="${colors.white}">${esc(line)}</text>`).join("")}
    </g>
  `;
}

function screenshot1() {
  const content = `
    ${header("Build a collectible rhythm card.", "Pick a title, mood, BPM, and energy level, then publish the full vibe on Base.")}
    ${glassCard(72, 370, 548, 260, "Composer", ["Midnight Drive", "Neon calm", "124 BPM / energy 4"], colors.cyan)}
    ${glassCard(664, 370, 548, 260, "Why it reads fast", ["Track-style layout", "Mood and tempo show first"], colors.pink)}
    ${playerCard(72, 676, "Midnight Drive", "Neon calm", 124, 4, "A clean late-night rhythm card for builders who want to post a vibe, tempo, and note on Base.")}
    <rect x="72" y="2522" width="1140" height="122" rx="28" fill="url(#bar)"/>
    <text x="642" y="2598" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#050816">PUBLISH ON BASE</text>
  `;
  return frame(content);
}

function screenshot2() {
  const content = `
    ${header("The card looks like a player, not a form.", "Tempo Card is meant to feel closer to releasing a track than filling a utility dashboard.")}
    ${playerCard(72, 370, "Glass Horizon", "Open-road lift", 138, 5, "A brighter higher-BPM version that feels like moving lights, fresh momentum, and a confident night build session.")}
    ${glassCard(72, 1352, 548, 230, "Identity", ["Music-flavored social post", "Useful even without a long feed"], colors.mint)}
    ${glassCard(664, 1352, 548, 230, "Chain value", ["Every card is timestamped on Base", "Easy to load later by ID"], colors.gold)}
  `;
  return frame(content);
}

function screenshot3() {
  const content = `
    ${header("Load older cards by ID.", "The archive view keeps mood, BPM, creator, and date readable without rebuilding the whole post.")}
    ${glassCard(72, 370, 1140, 208, "Lookup", ["Card ID 12", "Creator 0x9936...9652", "Published on Base"], colors.cyan)}
    ${playerCard(72, 628, "Silver Echo", "Soft pulse", 92, 2, "A low-BPM card for slower reflective sessions, saved onchain as a compact personal mood snapshot.")}
    ${glassCard(72, 1588, 548, 230, "Use case", ["Personal archive", "Creative identity layer"], colors.pink)}
    ${glassCard(664, 1588, 548, 230, "Reader value", ["One glance tells the story", "Mood, tempo, energy, note"], colors.cyan)}
  `;
  return frame(content);
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${colors.bg}"/>
    <circle cx="512" cy="512" r="350" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" stroke-width="20"/>
    <circle cx="512" cy="512" r="198" fill="none" stroke="${colors.cyan}" stroke-width="34"/>
    <circle cx="512" cy="512" r="76" fill="${colors.white}"/>
    <rect x="246" y="780" width="532" height="22" rx="11" fill="rgba(255,255,255,0.08)"/>
    <rect x="246" y="780" width="392" height="22" rx="11" fill="url(#bar)"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${colors.cyan}"/>
        <stop offset="40%" stop-color="${colors.mint}"/>
        <stop offset="70%" stop-color="${colors.gold}"/>
        <stop offset="100%" stop-color="${colors.pink}"/>
      </linearGradient>
    </defs>
    <rect width="1910" height="1000" fill="${colors.bg}"/>
    <ellipse cx="340" cy="80" rx="420" ry="260" fill="rgba(130,232,255,0.24)"/>
    <ellipse cx="1530" cy="120" rx="340" ry="220" fill="rgba(255,125,157,0.14)"/>
    <text x="100" y="172" font-family="Arial, sans-serif" font-size="118" font-weight="900" fill="${colors.white}">Tempo Card</text>
    <text x="104" y="236" font-family="Arial, sans-serif" font-size="40" font-weight="800" fill="${colors.soft}">Post a BPM, mood, and scene note in a player-style Base app.</text>
    ${playerCard(92, 300, "Midnight Drive", "Neon calm", 124, 4, "A clean late-night rhythm card for builders who want to post a vibe, tempo, and note on Base.")}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png({ quality: 92, compressionLevel: 9 })
    .toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

const manifest = {
  generatedAt: new Date().toISOString(),
  files,
};

await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

for (const file of files) {
  console.log(file);
}
