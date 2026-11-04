import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 5000);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
const BLOCK = /^\/(src|scripts|functions|node_modules|\.git)\b|\.rules$|^\/(package|package-lock|tsconfig|firebase|firestore\.indexes)\.json$|^\/\./;

/* نفس هيدرات الأمان بتاعت firebase.json عشان الاختبار المحلي يطابق النشر */
let HEADERS = {};
try {
  const fb = JSON.parse(fs.readFileSync(path.join(ROOT, 'firebase.json'), 'utf8'));
  for (const h of fb.hosting.headers[0].headers) HEADERS[h.key] = h.value;
} catch {}

http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || BLOCK.test(p)) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { ...HEADERS, 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}).listen(PORT, '0.0.0.0', () => {
  const lan = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('\nوصلة شغالة محليًا. الروابط:\n');
  console.log(`  1) http://localhost:${PORT}      <- فايربيس بيقبله من غير أي إعداد، والموقع والإشعارات بيشتغلوا عليه`);
  console.log(`  2) http://127.0.0.1:${PORT}      <- لازم تضيف 127.0.0.1 في Authentication > Settings > Authorized domains`);
  lan.forEach(ip => console.log(`  3) http://${ip}:${PORT}   <- من موبايلك على نفس الواي فاي (دخول جوجل مش هيشتغل عليه، وراجع الملحوظة)`));
  console.log('\nوقّفه بـ Ctrl+C\n');
});
