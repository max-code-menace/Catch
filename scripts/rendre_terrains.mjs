// Transforme design/terrains/<sport>.svg (fabriqués par generer_terrains.py) en assets/terrains/<sport>.jpg (×2, JPEG pour rester léger).
// node scripts/rendre_terrains.mjs [planche.png]  → avec un chemin, fait aussi une planche de tous les terrains.
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(racine, 'design', 'terrains');
const cible = join(racine, 'assets', 'terrains');
mkdirSync(cible, { recursive: true });

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 600, height: 300 }, deviceScaleFactor: 2 });
const fichiers = readdirSync(source).filter((f) => f.endsWith('.svg')).sort();
for (const f of fichiers) {
  const svg = readFileSync(join(source, f), 'utf8');
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.locator('svg').screenshot({ path: join(cible, f.replace('.svg', '.jpg')), type: 'jpeg', quality: 86 });
  console.log('✓', f);
}
const planche = process.argv[2];
if (planche) {
  const p2 = await navigateur.newPage({ viewport: { width: 1240, height: 100 }, deviceScaleFactor: 1 });
  const cases = fichiers
    .map((f) => `<figure style="margin:0"><div style="border-radius:16px;overflow:hidden;width:600px;height:300px">${readFileSync(join(source, f), 'utf8')}</div><figcaption style="color:#fff;font:14px sans-serif;padding:4px">${f}</figcaption></figure>`)
    .join('');
  await p2.setContent(`<body style="margin:0;background:#140d0b;display:grid;grid-template-columns:600px 600px;gap:12px;padding:12px">${cases}</body>`);
  await p2.screenshot({ path: planche, fullPage: true });
}
await navigateur.close();
