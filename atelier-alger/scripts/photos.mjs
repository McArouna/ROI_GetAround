/**
 * Inventaire des photos attendues.
 *   npm run photos          → liste ce qui manque dans public/products/
 *   npm run photos -- --all → liste tout, présent ou non
 *
 * Les chemins sont lus directement dans src/data/products.ts et dans les
 * visuels éditoriaux des pages : pas de liste à tenir à jour en double.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const racine = new URL('../', import.meta.url);
const sources = [
  'src/data/products.ts',
  'src/data/artisans.ts',
  'src/pages/index.astro',
];

const attendues = new Set();
for (const fichier of sources) {
  const contenu = readFileSync(fileURLToPath(new URL(fichier, racine)), 'utf8');
  for (const [, chemin] of contenu.matchAll(/'(\/products\/[^']+)'/g)) attendues.add(chemin);
}

const tout = process.argv.includes('--all');
const lignes = [...attendues].sort().map((chemin) => {
  const present = existsSync(fileURLToPath(new URL(`.${chemin}`, new URL('public/', racine))));
  return { chemin, present };
});

const manquantes = lignes.filter((l) => !l.present);
for (const { chemin, present } of tout ? lignes : manquantes) {
  console.log(`${present ? '✓' : '·'} public${chemin}`);
}

const dossier = fileURLToPath(new URL('public/products/', racine));
const inattendues = existsSync(dossier)
  ? readdirSync(dossier, { withFileTypes: true })
      .filter((e) => e.isFile() && !e.name.startsWith('.'))
      .map((e) => `/products/${e.name}`)
      .filter((c) => !attendues.has(c))
  : [];

console.log(
  `\n${attendues.size - manquantes.length}/${attendues.size} photo(s) en place — ${manquantes.length} manquante(s).`,
);
if (inattendues.length) {
  console.log(
    `\nFichiers présents mais non référencés (nom inattendu ?) :\n${inattendues.map((c) => `  public${c}`).join('\n')}`,
  );
}
