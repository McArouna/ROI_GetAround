/**
 * Identité de marque — TOUT se change ici.
 * Le nom « Atelier Alger » est provisoire : modifier `brand.nom` le remplace
 * partout (header, footer, <title>, pages, métadonnées).
 */

export const brand = {
  nom: 'Atelier Alger',
  promesse: 'Céramique artisanale faite à la main',
  accroche: 'Céramique algérienne peinte à la main, pièce par pièce.',
  /** Coordonnées : à remplacer par les vraies avant mise en ligne. */
  contact: {
    email: 'bonjour@atelier-alger.fr',
    telephone: '+33 6 00 00 00 00',
  },
} as const;

/** Prix : placeholder unique, à remplacer quand la grille tarifaire est arrêtée. */
export const PRIX_PLACEHOLDER = 'xx €';

/** Messages de la barre d'annonce (défilants). */
export const annonces = [
  'Peint à la main, pièce par pièce',
  'Expédié depuis l’Algérie vers la France',
] as const;

/** Liens du pied de page. Les pages correspondantes sont dans src/data/infos.ts. */
export const liensFooter = [
  { libelle: 'Livraison', href: '/infos/livraison' },
  { libelle: 'Retours', href: '/infos/retours' },
  { libelle: 'CGV', href: '/infos/cgv' },
  { libelle: 'Mentions légales', href: '/infos/mentions-legales' },
] as const;

export const lienArtisanPartenaire = {
  libelle: 'Devenir artisan partenaire',
  href: '/infos/artisan-partenaire',
} as const;
