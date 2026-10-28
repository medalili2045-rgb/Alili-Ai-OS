/**
 * Copies web assets from root to www/ folder
 * Runs before `cap sync` to ensure www/ is populated
 * Cross-platform (Windows / Linux / macOS)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');

const FILES = [
  'index.html',
  'capacitor-bridge.js',
  'sw.js',
  'manifest.json'
];

const DIRS = [
  'assets'
];

if (!fs.existsSync(WWW)) {
  fs.mkdirSync(WWW, { recursive: true });
  console.log('📁 Created www/');
}

FILES.forEach(f => {
  const src = path.join(ROOT, f);
  const dest = path.join(WWW, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${f}`);
  } else {
    console.warn(`⚠ Missing ${f} — skipped`);
  }
});

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(item => {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  });
}

DIRS.forEach(d => {
  const src = path.join(ROOT, d);
  if (fs.existsSync(src)) {
    copyDir(src, path.join(WWW, d));
    console.log(`✓ Copied ${d}/`);
  } else {
    console.warn(`⚠ Missing ${d}/ — skipped`);
  }
});

console.log('✅ www/ ready');
