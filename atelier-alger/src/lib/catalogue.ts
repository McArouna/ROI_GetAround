/**
 * Catalogue tel qu'il est montré sur le site.
 *
 * Une pièce n'apparaît que si sa photo est livrée (src/data/ en garde
 * l'intégralité, textes compris) : aucune case vide sur le site. Les types de
 * pièces et les collections sans aucune pièce photographiée disparaissent
 * aussi de la navigation — ils reviennent d'eux-mêmes dès qu'une photo arrive.
 */
import { getArtisan } from '../data/artisans';
import { categories, type CategorieId } from '../data/categories';
import { collections, type CollectionId } from '../data/collections';
import { products, type Product } from '../data/products';
import { visuelDisponible } from './images';

export const piecesAffichables: Product[] = products.filter((p) => visuelDisponible(p.image));

export function collectionDe(produit: Product): CollectionId {
  return produit.collection ?? getArtisan(produit.artisan).collection;
}

export function piecesDuType(id: CategorieId): Product[] {
  return piecesAffichables.filter((p) => p.categorie === id);
}

export function piecesDeLaCollection(id: CollectionId): Product[] {
  return piecesAffichables.filter((p) => collectionDe(p) === id);
}

export const typesAffichables = categories.filter((c) => piecesDuType(c.id).length > 0);

export const collectionsAffichables = collections.filter(
  (c) => piecesDeLaCollection(c.id).length > 0,
);

/** Galerie d'une pièce : seulement les vues réellement livrées. */
export function vuesDisponibles(produit: Product): string[] {
  return produit.galerie.filter((vue) => visuelDisponible(vue));
}

/** Pièces liées : même type ou même main, à défaut le reste du catalogue. */
export function piecesLiees(produit: Product, nombre = 3): Product[] {
  const autres = piecesAffichables.filter((p) => p.id !== produit.id);
  const proches = autres.filter(
    (p) => p.categorie === produit.categorie || p.artisan === produit.artisan,
  );
  const reste = autres.filter((p) => !proches.includes(p));
  return [...proches, ...reste].slice(0, nombre);
}
