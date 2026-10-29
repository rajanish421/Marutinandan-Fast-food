/* =====================================================================
   BUILD  -  source code (src/) ko browser ke liye bundle karta hai.

   ⚠️  Aapko ye SIRF tab chalana hai jab aap CODE (src/ folder) badlo.
       Menu / prices / text badalne ke liye build ki zarurat NAHI hai -
       wo sab data/shop-data.js se hota hai.

   Use:
     npm install            (ek baar)
     npm run build          (bundle + SEO tags)
     npm run dev            (code badalte hi auto-rebuild)

   Output:  assets/js/app.js      (UI, animations, cart)
            assets/js/scene3d.js  (three.js 3D models + viewer)
   ===================================================================== */
import { pathToFileURL, fileURLToPath } from 'node:url';
import { statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dev = process.argv.includes('--dev');
const watch = process.argv.includes('--watch');

// esbuild ko normal npm package ki tarah dhundo; na mile to ESBUILD_PATH env se.
let esbuild;
try {
  esbuild = await import(process.env.ESBUILD_PATH ? pathToFileURL(process.env.ESBUILD_PATH).href : 'esbuild');
} catch (e) {
  console.error('esbuild nahi mila. Pehle `npm install` chalao.\n', e.message);
  process.exit(1);
}

const common = {
  absWorkingDir: root,
  bundle: true,
  format: 'iife',
  target: ['es2020', 'chrome90', 'safari15', 'firefox90'],
  minify: !dev,
  sourcemap: dev ? 'linked' : false,
  legalComments: 'none',
  logLevel: 'info',
  define: { 'process.env.NODE_ENV': dev ? '"development"' : '"production"' },
};

const entries = [
  { in: 'src/ui/main.js', out: 'assets/js/app.js' },
  { in: 'src/three/entry.js', out: 'assets/js/scene3d.js' },
];

for (const e of entries) {
  const opts = { ...common, entryPoints: [e.in], outfile: e.out };
  if (watch) {
    const ctx = await esbuild.context(opts);
    await ctx.watch();
  } else {
    await esbuild.build(opts);
    const kb = (statSync(path.join(root, e.out)).size / 1024).toFixed(0);
    console.log(`✓ ${e.out}  (${kb} KB)`);
  }
}
if (watch) console.log('👀 Watching src/ ... (Ctrl+C se band)');
