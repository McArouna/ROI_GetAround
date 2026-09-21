/**
 * Identité de marque — TOUT se change ici.
 * Le nom « Atelier Alger » est provisoire : modifier `brand.nom` le remplace
 * partout (header, footer, <title>, page produit, métadonnées).
 */

export const brand = {
  nom: 'Atelier Alger',
  nomCourt: 'Atelier Alger',
  /** Accent arabe de la baseline — décoratif, voir i18n phase 2 dans le README. */
  baselineArabe: 'صناعة يدوية',
  promesse: 'Céramique artisanale faite à la main',
  accroche:
    'Céramique algérienne peinte à la main, pièce par pièce, et acheminée jusqu’à votre table en France.',
  /** Coordonnées : PLACEHOLDERS, à remplacer par les vraies avant mise en ligne. */
  contact: {
    email: '[bonjour@atelier-alger.fr]',
    telephone: '[+33 6 00 00 00 00]',
    adresse: '[Atelier & point de retrait — Paris, France]',
    delai: 'Réponse sous [48 h] ouvrées',
  },
  reseaux: [
    { nom: 'Instagram', url: '[#]' },
    { nom: 'Pinterest', url: '[#]' },
    { nom: 'WhatsApp', url: '[#]' },
  ],
} as const;

/** Prix : placeholder unique, à remplacer quand la grille tarifaire est arrêtée. */
export const PRIX_PLACEHOLDER = '[PRIX]';

/** Navigation principale. */
export const navigation = [
  { libelle: 'La collection', href: '/collection' },
  { libelle: 'L’atelier', href: '/#philosophie' },
  { libelle: 'Traçabilité', href: '/#valeurs' },
] as const;

export const liensFooter = [
  { libelle: 'À propos', href: '/#philosophie' },
  { libelle: 'Témoignages', href: '/#temoignages' },
  { libelle: 'Contact', href: '/#contact' },
] as const;

/**
 * Sélecteur de langue — FR seul est actif pour le MVP.
 * L’arabe reste un accent typographique ; locale RTL complète = phase 2.
 */
export const langues = [
  { code: 'fr', libelle: 'FR', actif: true },
  { code: 'ar', libelle: 'AR', actif: false },
  { code: 'en', libelle: 'EN', actif: false },
] as const;
