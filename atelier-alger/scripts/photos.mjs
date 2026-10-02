/**
 * Inventaire des visuels.
 *
 *   npm run photos          → ce qui manque
 *   npm run photos -- --all → l'inventaire complet
 *
 * Trois états pour chaque visuel attendu par le site :
 *   ✓ livré      le jeu WebP + repli est présent dans public/products/
 *   ~ à traiter  la photo brute est dans sources/, il reste à lancer
 *                « npm run detourer » puis « npm run images »
 *   · manquant   aucune photo reçue
 *
 * Les chemins attendus sont lus dans src/data/ et dans les pages : pas de
 * liste à tenir à jour en double.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const racine = new URL('../', import.meta.url);
const chemin = (relatif) => fileURLToPath(new URL(relatif, racine));

const sourcesCode = [
  'src/data/products.ts',
  'src/data/artisans.ts',
  'src/pages/index.astro',
  'src/pages/produits/[slug].astro',
];

const attendus = new Set();
for (const fichier of sourcesCode) {
  const contenu = readFileSync(chemin(fichier), 'utf8');
  for (const [, base] of contenu.matchAll(/['"](\/products\/[A-Za-z0-9\-/]+)['"]/g)) {
    attendus.add(base);
  }
}

const extensionsSource = ['.jpg', '.jpeg', '.png', '.webp'];
const etat = (base) => {
  const nom = base.replace('/products/', '');
  const livre = existsSync(chemin(`public${base}.webp`));
  const detoure = existsSync(chemin(`sources/detoures/${nom}.png`));
  const brute = extensionsSource.some((e) => existsSync(chemin(`sources/${nom}${e}`)));
  if (livre) return { signe: '✓', libelle: 'livré' };
  if (detoure) return { signe: '~', libelle: 'détouré, lancer « npm run images »' };
  if (brute) return { signe: '~', libelle: 'photo brute reçue, lancer « npm run detourer »' };
  return { signe: '·', libelle: 'manquant' };
};

const tout = process.argv.includes('--all');
const lignes = [...attendus].sort().map((base) => ({ base, ...etat(base) }));
const livres = lignes.filter((l) => l.signe === '✓');

for (const ligne of tout ? lignes : lignes.filter((l) => l.signe !== '✓')) {
  console.log(`${ligne.signe} ${ligne.base.replace('/products/', '')} — ${ligne.libelle}`);
}

console.log(`\n${livres.length}/${lignes.length} visuel(s) en place.`);

// Fichiers présents dans public/products/ sans entrée dans les données : en
// général une faute de frappe dans le nom.
const dossier = chemin('public/products');
const connus = new Set([...attendus].map((b) => b.replace('/products/', '')));
const inattendus = existsSync(dossier)
  ? [
      ...new Set(
        readdirSync(dossier, { withFileTypes: true })
          .filter((e) => e.isFile() && !e.name.startsWith('.'))
          .map((e) => e.name.replace(/(@2x)?\.(webp|png|jpe?g)$/i, '')),
      ),
    ].filter((nom) => !connus.has(nom))
  : [];
if (inattendus.length) {
  console.log(`\nFichiers non référencés (nom inattendu ?) :\n  ${inattendus.join('\n  ')}`);
}
