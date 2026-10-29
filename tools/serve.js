/* =====================================================================
   SERVE  -  website ko apne computer par chalane ke liye chhota server.

   Use:    npm run serve                (http://localhost:8080)
           node tools/serve.js 3000     (alag port)

   Koi package install nahi chahiye. Sirf Node.js chahiye.
   (Website live karne ke liye is server ki zarurat nahi - poora folder
    kisi bhi static hosting par upload kar do: Netlify, Vercel, GitHub
    Pages, Cloudflare Pages, ya normal hosting.)
   ===================================================================== */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv.find((a) => /^\d+$/.test(a))) || Number(process.env.PORT) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp4': 'video/mp4',
};

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.normalize(path.join(root, p));
    // folder ke bahar ki files kabhi nahi dikhani
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end('Forbidden'); return; }
    // code / tools / node_modules ko bhi nahi dikhana (sirf website ki files)
    const top = path.relative(root, file).split(path.sep)[0];
    if (['node_modules', 'tools', 'src', 'docs', '.git'].includes(top) || top === 'package.json' || top === 'package-lock.json') {
      res.writeHead(404).end('Not found'); return;
    }
    const st = await stat(file);
    if (!st.isFile()) throw new Error('not a file');
    const body = await readFile(file);
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 - page nahi mila');
  }
});

server.listen(port, () => {
  console.log(`\n  Maruti Nandan website chal rahi hai:\n  -> http://localhost:${port}\n\n  Band karne ke liye Ctrl+C dabao.\n`);
});
