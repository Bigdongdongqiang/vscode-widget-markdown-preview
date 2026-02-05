const fs = require('fs');
const path = require('path');
const pkgDir = path.dirname(require.resolve('marked/package.json'));
const src = path.join(pkgDir, 'marked.min.js');
const destDir = path.join(__dirname, '..', 'media');
const dest = path.join(destDir, 'marked.min.js');
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copied marked.min.js to media/');
