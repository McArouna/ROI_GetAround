import { existsSync } from 'node:fs';
import { join, normalize } from 'node:path';

/**
 * Les chemins stockés dans src/data/ sont SANS extension
 * (ex. « /products/tasse-tanit ») : le pipeline d'images produit plusieurs
 * fichiers pour chaque visuel (WebP + repli, 1× et 2×) et c'est ce module qui
 * reconstitue le jeu disponible au moment du build.
 */

const dossierPublic = join(process.cwd(), 'public');

function fichierExiste(chemin: string): boolean {
  if (!chemin.startsWith('/') || chemin.includes('..')) return false;
  return existsSync(normalize(join(dossierPublic, chemin)));
}

export interface JeuImage {
  /** Au moins le WebP 1× et son repli existent. */
  existe: boolean;
  /** srcset WebP, densités disponibles seulement (jamais d'agrandissement). */
  webp: string;
  /** srcset du format de repli (PNG pour les packshots, JPEG pour les scènes). */
  repli: string;
  /** src de repli, pour les navigateurs sans srcset. */
  source: string;
  typeRepli: 'image/png' | 'image/jpeg';
}

/**
 * Jeu d'images pour un chemin de base.
 * `repli` vaut 'png' pour les packshots détourés (transparence) et 'jpg' pour
 * les photos d'ambiance.
 */
export function jeuImage(base: string, repli: 'png' | 'jpg' = 'png'): JeuImage {
  const webp1x = `${base}.webp`;
  const webp2x = `${base}@2x.webp`;
  const repli1x = `${base}.${repli}`;
  const repli2x = `${base}@2x.${repli}`;

  const aWebp1x = fichierExiste(webp1x);
  const aRepli1x = fichierExiste(repli1x);
  const densites = (un: string, deux: string, aDeux: boolean) =>
    aDeux ? `${un} 1x, ${deux} 2x` : `${un} 1x`;

  return {
    existe: aWebp1x && aRepli1x,
    webp: densites(webp1x, webp2x, fichierExiste(webp2x)),
    repli: densites(repli1x, repli2x, fichierExiste(repli2x)),
    source: repli1x,
    typeRepli: repli === 'png' ? 'image/png' : 'image/jpeg',
  };
}

/** Vrai si le visuel a déjà été livré et traité. */
export function visuelDisponible(base: string, repli: 'png' | 'jpg' = 'png'): boolean {
  return jeuImage(base, repli).existe;
}

/**
 * Remonte les pièces déjà photographiées en tête de liste (tri stable :
 * l'ordre du catalogue est conservé à l'intérieur de chaque groupe).
 * La page d'accueil met ainsi en avant ce qui a une vraie photo, sans qu'on
 * ait à réordonner products.ts à chaque livraison de visuels.
 */
export function photosDabord<T extends { image: string }>(produits: T[]): T[] {
  return [...produits].sort(
    (a, b) => Number(visuelDisponible(b.image)) - Number(visuelDisponible(a.image)),
  );
}
