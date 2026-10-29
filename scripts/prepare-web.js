const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');

if (!fs.existsSync(WWW)) fs.mkdirSync(WWW, { recursive: true });

['index.html', 'capacitor-bridge.js', 'sw.js', 'manifest.json'].forEach(f => {
    const src = path.join(ROOT, f);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(WWW, f));
        console.log(`✅ ${f}`);
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
    console.log(`✅ ${path.basename(src)}/`);
}

['assets', 'css', 'js'].forEach(dir => {
    if (fs.existsSync(path.join(ROOT, dir))) {
        copyDir(path.join(ROOT, dir), path.join(WWW, dir));
    }
});

console.log('🚀 www/ ready!');
