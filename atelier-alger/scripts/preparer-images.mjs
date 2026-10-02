/**
 * Normalisation et export des images — étape 2 du pipeline.
 *
 *   npm run images                 # toutes les images
 *   npm run images -- tasse-tanit  # une seule
 *   npm run images -- --heuristique # détourage de secours, sans Python
 *
 * Entrées
 *   sources/detoures/<id>.png   packshot détouré (étape 1 : npm run detourer)
 *   sources/<id>.(jpg|png|webp) photo brute — sert aux scènes, et au
 *                               détourage de secours
 * Sorties
 *   public/products/<id>{,@2x}.{webp,png}   packshots, fond transparent
 *   public/products/<id>{,@2x}.{webp,jpg}   scènes (photos d'ambiance)
 *
 * Un seul système pour toute la série :
 *  - fond transparent : le fond visible est TOUJOURS celui de la section du
 *    site, jamais celui de la photo ;
 *  - échelle normalisée : chaque objet est ramené à la même masse visuelle
 *    (celle d'une pièce verticale haute de 70 % du cadre), donc la marge
 *    interne est constante d'une vignette à l'autre — aucun zoom au cas par
 *    cas côté CSS ;
 *  - aucune ombre cuite dans l'image : l'ombre est posée en CSS, une seule
 *    direction de lumière pour toute la série ;
 *  - mêmes dimensions de sortie pour toutes les pièces, WebP + PNG de repli,
 *    en 1× et 2×.
 */
import sharp from 'sharp';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const DOSSIER_SOURCES = 'sources';
const DOSSIER_DETOURES = 'sources/detoures';
const DOSSIER_SORTIE = 'public/products';

/** Cadre packshot au ratio 4:5, exporté en 2× (1× = la moitié). */
const CADRE_LARGEUR = 800;
const CADRE_HAUTEUR = 1000;
/**
 * Échelle apparente : part de la hauteur du cadre occupée par une pièce
 * verticale type (une qraba, une carafe, un mug haut).
 */
const PART_PRODUIT = 0.7;
/**
 * Proportion (largeur / hauteur) de cette pièce de référence. L'aire qu'elle
 * occupe sert de cible à TOUTES les pièces : une tasse large est ramenée à la
 * même masse visuelle qu'une qraba haute, au lieu d'écraser la grille. Sans
 * cela, « 70 % de la hauteur » appliqué tel quel à un objet deux fois plus
 * large qu'un autre donne une vignette 40 % plus lourde à l'œil.
 */
const RATIO_REFERENCE = 0.72;
/** Plafonds, pour les pièces très larges (plats) ou très hautes (carafes). */
const PART_LARGEUR_MAX = 0.86;
const PART_HAUTEUR_MAX = 0.74;
/** Alpha au-delà duquel un pixel compte comme du contenu. */
const SEUIL_ALPHA = 12;

/** Photos d'ambiance : conservées telles quelles, sans détourage. */
const SCENES = new Set([
  'hero-nature-morte',
  'atelier-ambiance',
  'atelier-mains',
  'atelier-sechage',
  'sortie-de-four',
]);
/** Les gros plans « <id>-detail-N » sont aussi des photos, pas des packshots. */
const estScene = (identifiant) => SCENES.has(identifiant) || identifiant.includes('-detail-');

/**
 * Recadrages d'un plan de groupe : le détourage peut ramener un morceau de
 * la pièce voisine. On ne garde alors que la plus grande forme.
 */
const FORME_UNIQUE = new Set(['assiette-rayee-ghardaia', 'gobelets-rayes']);

/** En dessous de cette largeur, une scène n'est servie qu'en une densité. */
const LARGEUR_MIN_2X = 1200;

/* ------------------------------------------------------------------ *
 * Détourage de secours (sans Python).
 *
 * Qualité nettement inférieure au modèle de l'étape 1 : un émail blanc sur
 * fond crème ne se distingue pas par la couleur, et une ombre portée douce est
 * aussi neutre que la paroi blanche qu'elle touche. La méthode ci-dessous
 * s'appuie sur les contours (une marche nette, là où le fond et les ombres
 * sont lisses), ce qui dépanne mais laisse des approximations.
 * ------------------------------------------------------------------ */

const SEUIL_CONTOUR = 3.2;
const DILATATION = 1.7;
const DERIVE_MAX = 62;
const SAT_MAX = 0.3;
const LISSAGE = 1.8;

const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

const saturation = (r, g, b) => {
  const max = Math.max(r, g, b);
  return max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
};

/**
 * Applique des opérations sur un plan 8 bits et rend un buffer STRICTEMENT à
 * 1 canal : sans `toColourspace`, sharp repasse en RVB et les index du masque
 * se décalent d'un facteur 3.
 */
async function planGris(buffer, w, h, operations) {
  const tuyau = operations(
    sharp(buffer, { raw: { width: w, height: h, channels: 1 } }).toColourspace('b-w'),
  );
  const { data, info } = await tuyau.raw().toBuffer({ resolveWithObject: true });
  if (info.channels !== 1 || data.length !== w * h) {
    throw new Error(`plan gris inattendu : ${info.channels} canaux, ${data.length} octets`);
  }
  return data;
}

const dilater = (buffer, w, h, rayon) =>
  planGris(buffer, w, h, (t) => t.blur(rayon).linear(255, -255 * 10));

const eroder = (buffer, w, h, rayon) =>
  planGris(buffer, w, h, (t) => t.blur(rayon).linear(255, -255 * 245));

/** Couleur du fond : médiane d'un cadre de 4 px sur le pourtour. */
function couleurDuFond(data, w, h, canaux) {
  const canal = [[], [], []];
  const ajouter = (x, y) => {
    const i = (y * w + x) * canaux;
    for (let k = 0; k < 3; k++) canal[k].push(data[i + k]);
  };
  for (let x = 0; x < w; x++) for (let d = 0; d < 4; d++) ajouter(x, d), ajouter(x, h - 1 - d);
  for (let y = 0; y < h; y++) for (let d = 0; d < 4; d++) ajouter(d, y), ajouter(w - 1 - d, y);
  return canal.map((v) => v.sort((a, b) => a - b)[Math.floor(v.length / 2)]);
}

/** Masque du fond : remplissage depuis les bords, bloqué par les contours. */
async function masqueDuFond(data, w, h, canaux, fond, tolerance) {
  const seuilContour = SEUIL_CONTOUR * tolerance;
  const deriveMax = DERIVE_MAX * tolerance;
  const lumFond = luminance(...fond);

  const lum = new Float32Array(w * h);
  const sat = new Float32Array(w * h);
  const octets = Buffer.alloc(w * h);
  for (let p = 0; p < w * h; p++) {
    const i = p * canaux;
    lum[p] = luminance(data[i], data[i + 1], data[i + 2]);
    sat[p] = saturation(data[i], data[i + 1], data[i + 2]);
    octets[p] = Math.round(lum[p]);
  }

  const lisse = await planGris(octets, w, h, (t) => t.blur(1));
  const contours = Buffer.alloc(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const g =
        Math.abs(lisse[p + 1] - lisse[p - 1]) / 2 + Math.abs(lisse[p + w] - lisse[p - w]) / 2;
      if (g > seuilContour) contours[p] = 255;
    }
  }
  const barriere = await dilater(contours, w, h, DILATATION);

  const estFond = new Uint8Array(w * h);
  const pile = new Int32Array(w * h);
  let sommet = 0;
  const examiner = (p) => {
    if (estFond[p] || barriere[p] >= 128) return;
    if (sat[p] > SAT_MAX) return;
    if (lum[p] - lumFond >= 30 || lumFond - lum[p] > deriveMax) return;
    estFond[p] = 1;
    pile[sommet++] = p;
  };
  for (let x = 0; x < w; x++) examiner(x), examiner((h - 1) * w + x);
  for (let y = 0; y < h; y++) examiner(y * w), examiner(y * w + w - 1);
  while (sommet > 0) {
    const p = pile[--sommet];
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) examiner(p - 1);
    if (x < w - 1) examiner(p + 1);
    if (y > 0) examiner(p - w);
    if (y < h - 1) examiner(p + w);
  }

  // Compense la dilatation des contours, qui a laissé un halo de fond.
  const silhouette = Buffer.alloc(w * h);
  for (let p = 0; p < w * h; p++) silhouette[p] = estFond[p] ? 0 : 255;
  const resserree = await eroder(silhouette, w, h, DILATATION);
  for (let p = 0; p < w * h; p++) estFond[p] = resserree[p] < 128 ? 1 : 0;
  return estFond;
}

/** Ne garde que la plus grande forme : supprime les poussières détachées. */
function plusGrandeForme(estFond, w, h) {
  const vu = new Uint8Array(w * h);
  const pile = new Int32Array(w * h);
  let meilleure = [];
  for (let depart = 0; depart < w * h; depart++) {
    if (estFond[depart] || vu[depart]) continue;
    let sommet = 0;
    const forme = [];
    vu[depart] = 1;
    pile[sommet++] = depart;
    while (sommet > 0) {
      const p = pile[--sommet];
      forme.push(p);
      const x = p % w;
      const y = (p - x) / w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q < 0 || vu[q] || estFond[q]) continue;
        vu[q] = 1;
        pile[sommet++] = q;
      }
    }
    if (forme.length > meilleure.length) meilleure = forme;
  }
  const garde = new Uint8Array(w * h);
  for (const p of meilleure) garde[p] = 1;
  return { garde, taille: meilleure.length };
}

/** Efface tout ce qui n'appartient pas à la plus grande forme opaque. */
function garderPlusGrandeForme(rgba, w, h) {
  const transparent = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) transparent[p] = rgba[p * 4 + 3] <= SEUIL_ALPHA ? 1 : 0;
  const { garde } = plusGrandeForme(transparent, w, h);
  const net = Buffer.from(rgba);
  for (let p = 0; p < w * h; p++) if (!garde[p]) net[p * 4 + 3] = 0;
  return net;
}

/** Packshot RVBA obtenu par détourage de secours. */
async function detourageDeSecours(chemin) {
  const { data, info } = await sharp(chemin)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  const fond = couleurDuFond(data, w, h, channels);

  for (const tolerance of [1, 1.35, 1.8, 2.4]) {
    const estFond = await masqueDuFond(data, w, h, channels, fond, tolerance);
    const { garde, taille } = plusGrandeForme(estFond, w, h);
    const partAire = taille / (w * h);
    if (partAire < 0.04 || partAire > 0.88) continue;

    const brut = Buffer.alloc(w * h);
    for (let p = 0; p < w * h; p++) brut[p] = garde[p] ? 255 : 0;
    const alpha = await planGris(brut, w, h, (t) => t.blur(LISSAGE).linear(2.4, -255 * 0.72));

    const rgba = Buffer.alloc(w * h * 4);
    for (let p = 0; p < w * h; p++) {
      const s = p * channels;
      const d = p * 4;
      rgba[d] = data[s];
      rgba[d + 1] = data[s + 1];
      rgba[d + 2] = data[s + 2];
      rgba[d + 3] = alpha[p];
    }
    return { rgba, w, h, fond };
  }
  throw new Error('détourage de secours impossible : lancer « npm run detourer »');
}

/* ------------------------------------------------------------------ *
 * Normalisation et export
 * ------------------------------------------------------------------ */

/** Boîte englobante du contenu (alpha significatif). */
function boiteDuContenu(rgba, w, h) {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] > SEUIL_ALPHA) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error('image entièrement transparente');
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/** Écrit un couple WebP + PNG de repli, aux dimensions demandées. */
async function exporterPackshot(buffer, nom, largeur, hauteur) {
  const base = join(DOSSIER_SORTIE, nom);
  const cadrer = () =>
    sharp(buffer).resize(largeur, hauteur, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  await cadrer().webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(`${base}.webp`);
  await cadrer().png({ compressionLevel: 9 }).toFile(`${base}.png`);
}

async function traiterPackshot(identifiant, options) {
  const detoure = join(DOSSIER_DETOURES, `${identifiant}.png`);
  let rgba;
  let w;
  let h;
  let origine;

  if (existsSync(detoure)) {
    const sortie = await sharp(detoure).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    rgba = sortie.data;
    w = sortie.info.width;
    h = sortie.info.height;
    origine = 'détourage modèle';
  } else if (options.heuristique) {
    const secours = await detourageDeSecours(options.source);
    rgba = secours.rgba;
    w = secours.w;
    h = secours.h;
    origine = 'détourage de secours';
  } else {
    console.log(
      `· ${identifiant} — pas de PNG détouré. Lancer « npm run detourer » ` +
        `(ou « npm run images -- --heuristique » pour un rendu de dépannage).`,
    );
    return false;
  }

  if (FORME_UNIQUE.has(identifiant)) rgba = garderPlusGrandeForme(rgba, w, h);
  const boite = boiteDuContenu(rgba, w, h);

  // Échelle normalisée : toutes les pièces occupent la même AIRE, celle d'une
  // pièce verticale type haute de 70 % du cadre. La marge interne est donc
  // constante d'une vignette à l'autre, et aucune forme ne domine la grille.
  const aireVisee = (CADRE_HAUTEUR * PART_PRODUIT) ** 2 * RATIO_REFERENCE;
  let echelle = Math.sqrt(aireVisee / (boite.width * boite.height));
  if (boite.height * echelle > CADRE_HAUTEUR * PART_HAUTEUR_MAX) {
    echelle = (CADRE_HAUTEUR * PART_HAUTEUR_MAX) / boite.height;
  }
  if (boite.width * echelle > CADRE_LARGEUR * PART_LARGEUR_MAX) {
    echelle = (CADRE_LARGEUR * PART_LARGEUR_MAX) / boite.width;
  }
  const largeur = Math.max(1, Math.round(boite.width * echelle));
  const hauteur = Math.max(1, Math.round(boite.height * echelle));

  const decoupe = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .extract(boite)
    .resize(largeur, hauteur, { fit: 'fill', kernel: 'lanczos3' })
    .png()
    .toBuffer();

  const cadre = await sharp({
    create: {
      width: CADRE_LARGEUR,
      height: CADRE_HAUTEUR,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: decoupe,
        left: Math.round((CADRE_LARGEUR - largeur) / 2),
        top: Math.round((CADRE_HAUTEUR - hauteur) / 2),
      },
    ])
    .png()
    .toBuffer();

  await exporterPackshot(cadre, `${identifiant}@2x`, CADRE_LARGEUR, CADRE_HAUTEUR);
  await exporterPackshot(cadre, identifiant, CADRE_LARGEUR / 2, CADRE_HAUTEUR / 2);

  const partHauteur = ((hauteur / CADRE_HAUTEUR) * 100).toFixed(0);
  const partAire = (((largeur * hauteur) / (CADRE_LARGEUR * CADRE_HAUTEUR)) * 100).toFixed(0);
  console.log(
    `✓ ${identifiant} — ${origine}, objet ${largeur}×${hauteur} px dans un cadre ` +
      `${CADRE_LARGEUR}×${CADRE_HAUTEUR} (${partHauteur} % de la hauteur, ${partAire} % de l’aire)`,
  );
  return true;
}

async function traiterScene(chemin, identifiant) {
  const source = sharp(chemin).rotate();
  const { width, height } = await source.metadata();
  const base = join(DOSSIER_SORTIE, identifiant);

  // Aucune image n'est agrandie. Une scène assez grande est servie en 1×
  // (demi-largeur) et 2× (largeur native) ; une petite ne l'est qu'en natif.
  const densites =
    width >= LARGEUR_MIN_2X
      ? [
          { suffixe: '', largeur: Math.round(width / 2) },
          { suffixe: '@2x', largeur: width },
        ]
      : [{ suffixe: '', largeur: width }];

  for (const { suffixe, largeur } of densites) {
    const hauteur = Math.round((largeur / width) * height);
    await source.clone().resize(largeur, hauteur).webp({ quality: 86, effort: 6 }).toFile(`${base}${suffixe}.webp`);
    await source
      .clone()
      .resize(largeur, hauteur)
      .jpeg({ quality: 86, mozjpeg: true })
      .toFile(`${base}${suffixe}.jpg`);
  }
  console.log(
    `✓ ${identifiant} — scène, ${width}×${height} px (${densites.length === 2 ? '1× + 2×' : '1× seul'}, WebP + JPEG)`,
  );
}

/* ------------------------------------------------------------------ */

if (!existsSync(DOSSIER_SOURCES)) {
  console.error(`Dossier « ${DOSSIER_SOURCES}/ » absent : y déposer les photos brutes.`);
  process.exit(1);
}
mkdirSync(DOSSIER_SORTIE, { recursive: true });

const arguments_ = process.argv.slice(2);
const options = { heuristique: arguments_.includes('--heuristique') };
const demandes = arguments_.filter((a) => !a.startsWith('-'));

const sources = new Map();
for (const fichier of readdirSync(DOSSIER_SOURCES)) {
  if (!/\.(jpe?g|png|webp)$/i.test(fichier)) continue;
  sources.set(basename(fichier, extname(fichier)), join(DOSSIER_SOURCES, fichier));
}
for (const fichier of existsSync(DOSSIER_DETOURES) ? readdirSync(DOSSIER_DETOURES) : []) {
  if (!/\.png$/i.test(fichier)) continue;
  const identifiant = basename(fichier, extname(fichier));
  if (!sources.has(identifiant)) sources.set(identifiant, join(DOSSIER_DETOURES, fichier));
}

const aTraiter = [...sources.entries()].filter(
  ([identifiant]) => demandes.length === 0 || demandes.includes(identifiant),
);
if (aTraiter.length === 0) {
  console.log('Rien à traiter.');
  process.exit(0);
}

for (const [identifiant, source] of aTraiter.sort(([a], [b]) => a.localeCompare(b))) {
  try {
    if (estScene(identifiant)) await traiterScene(source, identifiant);
    else await traiterPackshot(identifiant, { ...options, source });
  } catch (erreur) {
    console.error(`✗ ${identifiant} — ${erreur.message}`);
    process.exitCode = 1;
  }
}
