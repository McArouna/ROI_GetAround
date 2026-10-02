/**
 * Collections par région — l'autre porte d'entrée du catalogue, à côté des
 * types de pièces (src/data/categories.ts). Une pièce appartient à la
 * collection de l'artisan qui l'a peinte, sauf mention contraire dans
 * products.ts (champ `collection`).
 */

export const collections = [
  {
    id: 'alger-casbah',
    nom: 'Alger & la Casbah',
    intro: 'Ruelles, portes cloutées, calligraphie : la ville blanche peinte sur la terre.',
  },
  {
    id: 'terres-berberes',
    nom: 'Terres berbères',
    intro: 'Kabylie et M’zab : signes amazighs, émaux francs, rayures tirées au tour.',
  },
  {
    id: 'tlemcen-nedroma',
    nom: 'Tlemcen & Nedroma',
    intro: 'L’héritage andalou : fleurs en semis, rehauts, zellige taillé à la main.',
  },
  {
    id: 'constantine',
    nom: 'Constantine',
    intro: 'La faïence illustrée, des plateaux de fête aux affiches.',
  },
] as const;

export type CollectionId = (typeof collections)[number]['id'];

const parId = new Map(collections.map((c) => [c.id, c]));

export function getCollection(id: CollectionId) {
  const collection = parId.get(id);
  if (!collection) throw new Error(`Collection inconnue : ${id}`);
  return collection;
}
