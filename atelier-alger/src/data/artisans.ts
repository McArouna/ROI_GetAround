/**
 * Artisan·e·s — PLACEHOLDERS centralisés.
 * Les prénoms entre crochets sont fictifs : remplacer ici met à jour
 * le « Peint par … » de toutes les cartes et le bloc « L’artisan ».
 */

export interface Artisan {
  id: string;
  /** Prénom affiché. Placeholder entre crochets tant qu’il n’est pas validé. */
  nom: string;
  /** Nom de l’atelier ou du collectif. */
  atelier: string;
  ville: string;
  region: string;
  /** Métier précis, affiché sous le nom sur la page produit. */
  metier: string;
  /** 2 à 3 phrases, ancrées dans le geste — jamais de biographie inventée chiffrée. */
  bio: string;
  portrait: string;
}

export const artisans: Artisan[] = [
  {
    id: 'yasmine',
    nom: '[Yasmine]',
    atelier: '[Atelier des Terrasses]',
    ville: 'Alger',
    region: 'Casbah',
    metier: 'Peintre sur émail',
    bio: 'Elle peint assise face à la baie, pinceau à trois poils, sans report ni pochoir. Ses khamsas ne sont jamais deux fois identiques : le tracé suit la courbe de la pièce, pas l’inverse. Elle signe chaque fond d’un point d’argile.',
    portrait: '/products/artisans/yasmine',
  },
  {
    id: 'karim',
    nom: '[Karim]',
    atelier: '[Poterie du Mzab]',
    ville: 'Ghardaïa',
    region: 'M’zab',
    metier: 'Tourneur',
    bio: 'Formé au tour à pied dans l’atelier de son oncle, il monte ses carafes en une seule levée. Il dit reconnaître une bonne argile au bruit qu’elle fait quand on la claque sur la table.',
    portrait: '/products/artisans/karim',
  },
  {
    id: 'nawel',
    nom: '[Nawel]',
    atelier: '[Maison Tassili]',
    ville: 'Maatkas',
    region: 'Kabylie',
    metier: 'Céramiste, modelage au colombin',
    bio: 'Elle travaille sans tour, au colombin, comme les potières de son village. Les signes qu’elle trace — chevrons, losanges, peigne — sont ceux que sa grand-mère posait sur les jarres à eau.',
    portrait: '/products/artisans/nawel',
  },
  {
    id: 'sofiane',
    nom: '[Sofiane]',
    atelier: '[Atelier Nedroma]',
    ville: 'Nedroma',
    region: 'Tlemcen',
    metier: 'Décorateur, rehauts d’or',
    bio: 'Il pose les rehauts au dernier moment, après la seconde cuisson, sur une pièce encore tiède. Un tajine lui prend une journée entière ; il refuse d’en peindre deux le même jour.',
    portrait: '/products/artisans/sofiane',
  },
  {
    id: 'lilia',
    nom: '[Lilia]',
    atelier: '[Atelier Griwech]',
    ville: 'Constantine',
    region: 'Constantinois',
    metier: 'Illustratrice sur faïence',
    bio: 'Elle dessine les gâteaux avant de les peindre, à la mine de plomb, sur papier calque. Baklawa, makrout, griwech : elle passe autant de temps à les observer sur les plateaux de fête qu’à les reproduire.',
    portrait: '/products/artisans/lilia',
  },
  {
    id: 'mehdi',
    nom: '[Mehdi]',
    atelier: '[Zellige & Cie]',
    ville: 'Tlemcen',
    region: 'Tlemcen',
    metier: 'Carreleur-céramiste',
    bio: 'Il découpe ses carreaux à la main, arête par arête, puis les émaille un par un. Les légères différences d’épaisseur sont voulues : posés côte à côte, ils accrochent la lumière comme un vrai panneau ancien.',
    portrait: '/products/artisans/mehdi',
  },
  {
    id: 'amina',
    nom: '[Amina]',
    atelier: '[Savonnerie El Bahdja]',
    ville: 'Béjaïa',
    region: 'Kabylie',
    metier: 'Savonnière & illustratrice',
    bio: 'Elle coule ses savons à froid, les laisse sécher six semaines, puis les range dans des boîtes métal qu’elle illustre elle-même. La boîte se garde bien après le savon — c’est l’idée.',
    portrait: '/products/artisans/amina',
  },
];

const parId = new Map(artisans.map((a) => [a.id, a]));

export function getArtisan(id: string): Artisan {
  const artisan = parId.get(id);
  if (!artisan) throw new Error(`Artisan inconnu : ${id}`);
  return artisan;
}
