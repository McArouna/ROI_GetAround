/**
 * Catégories du catalogue. L’ordre de ce tableau est l’ordre d’affichage
 * sur la page /collection.
 */

export const categories = [
  {
    id: 'mugs',
    nom: 'Tasses & gobelets',
    intro:
      'Le premier café du matin dans une pièce peinte à la main : motifs amazighs, calligraphie, khamsa.',
  },
  {
    id: 'bols',
    nom: 'Bols',
    intro:
      'Terres cuites dégradées, signes tribaux, coffrets empilables pour la chorba comme pour le petit-déjeuner.',
  },
  {
    id: 'tajines',
    nom: 'Tajines décoratifs',
    intro:
      'Couvercles peints, floraux ou rehaussés d’or. Pensés pour la table dressée, pas pour le feu.',
  },
  {
    id: 'assiettes',
    nom: 'Assiettes & plats',
    intro: 'Motif tribal au centre, bord coloré au pinceau plat, une pièce par service.',
  },
  {
    id: 'plateaux',
    nom: 'Plateaux à pâtisseries',
    intro:
      'Notre signature : les gâteaux algériens peints à même la faïence — baklawa, bourek, makrout, griwech.',
  },
  {
    id: 'gourdes',
    nom: 'Qraba & fioles',
    intro: 'La gourde d’eau traditionnelle et ses cousines bouchées de liège, émaillées ou peintes.',
  },
  {
    id: 'pichets',
    nom: 'Pichets & services',
    intro: 'Rayures posées à main levée, becs tirés au pouce, anses montées à part.',
  },
  {
    id: 'zellige',
    nom: 'Carreaux & planches',
    intro: 'L’esprit du zellige, découpé et émaillé à la main, à poser ou à accrocher.',
  },
  {
    id: 'mains',
    nom: 'Mains de Fatma & repose-cuillères',
    intro: 'Les petites pièces qu’on offre, qu’on accroche à l’entrée ou qu’on pose près du feu.',
  },
  {
    id: 'savons',
    nom: 'Savons en boîte illustrée',
    intro: 'Saponifiés à froid, rangés dans une boîte métal peinte qui se garde après.',
  },
  {
    id: 'art-mural',
    nom: 'Art mural',
    intro: 'Cadres peints, def (tambourins) décorés, affiches — Alger la Blanche sur un mur parisien.',
  },
] as const;

export type CategorieId = (typeof categories)[number]['id'];

const parId = new Map(categories.map((c) => [c.id, c]));

export function getCategorie(id: CategorieId) {
  const categorie = parId.get(id);
  if (!categorie) throw new Error(`Catégorie inconnue : ${id}`);
  return categorie;
}
