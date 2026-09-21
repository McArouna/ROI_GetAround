import { existsSync } from 'node:fs';
import { join, normalize } from 'node:path';

/**
 * Vrai si la photo a déjà été déposée dans public/.
 *
 * Évalué au build (site statique) : dès que le client dépose le fichier au
 * bon nom, la vraie photo remplace le placeholder, sans toucher au code.
 * Le chemin est résolu depuis la racine du projet (process.cwd()), car le
 * code des pages est regroupé ailleurs au moment du build.
 */
const dossierPublic = join(process.cwd(), 'public');

export function photoExiste(src: string): boolean {
  if (!src.startsWith('/') || src.includes('..')) return false;
  return existsSync(normalize(join(dossierPublic, src)));
}

/**
 * Remonte les pièces déjà photographiées en tête de liste (tri stable :
 * l’ordre du catalogue est conservé à l’intérieur de chaque groupe).
 * La page d’accueil met ainsi en avant ce qui a une vraie photo, sans
 * qu’on ait à réordonner products.ts à chaque livraison de visuels.
 */
export function photosDabord<T extends { image: string }>(produits: T[]): T[] {
  return [...produits].sort(
    (a, b) => Number(photoExiste(b.image)) - Number(photoExiste(a.image)),
  );
}
