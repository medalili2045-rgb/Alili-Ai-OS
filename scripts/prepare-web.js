const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');

if (!fs.existsSync(WWW)) fs.mkdirSync(WWW, { recursive: true });

['index.html', 'capacitor-bridge.js', 'sw.js', 'manifest.json'].forEach(f => {
  if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(WWW, f));
});

if (fs.existsSync(path.join(ROOT, 'assets'))) {
  fs.mkdirSync(path.join(WWW, 'assets'), { recursive: true });
  fs.readdirSync(path.join(ROOT, 'assets')).forEach(item => {
    fs.copyFileSync(path.join(ROOT, 'assets', item), path.join(WWW, 'assets', item));
  });
}
console.log('www/ ready');
