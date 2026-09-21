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
