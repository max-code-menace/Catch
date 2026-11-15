// Génère src/theme/pictos.ts à partir des SVG de design/pictos/.
// Lancer : node scripts/generer-pictos.mjs (dans mobile/)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const source = join(ici, '../../design/pictos');
const sports = readdirSync(source)
  .filter((f) => f.endsWith('.svg'))
  .map((f) => f.replace('.svg', ''))
  .sort();

let sortie =
  '// Fichier généré par scripts/generer-pictos.mjs à partir de design/pictos/. Ne pas modifier à la main.\n\n' +
  'export const pictos = {\n';
for (const sport of sports) {
  let svg = readFileSync(join(source, `${sport}.svg`), 'utf8').replace(/\s*\n\s*/g, '').trim();
  // Identifiants rendus uniques par sport (sinon ils se mélangent quand plusieurs pictos sont à l'écran).
  const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  for (const id of ids) svg = svg.replaceAll(id, `${sport}_${id}`);
  svg = svg.replace(/ style="mask-type:luminance"/g, '');
  sortie += `  ${sport}:\n    ${JSON.stringify(svg)},\n`;
}
sortie += '} as const;\n\nexport type Sport = keyof typeof pictos;\n';
writeFileSync(join(ici, '../src/theme/pictos.ts'), sortie);
console.log(`${sports.length} pictos écrits.`);
