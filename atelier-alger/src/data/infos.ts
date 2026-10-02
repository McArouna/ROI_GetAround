/**
 * Pages d'information du pied de page. Les textes juridiques (CGV, mentions
 * légales) dépendent de la structure de la société : ils sont à fournir, le
 * site n'en invente pas.
 */
import { brand } from './brand';

export interface PageInfo {
  slug: string;
  titre: string;
  paragraphes: string[];
}

export const pagesInfos: PageInfo[] = [
  {
    slug: 'livraison',
    titre: 'Livraison',
    paragraphes: [
      'Chaque pièce est emballée à la main, dans du papier, et expédiée depuis l’Algérie vers la France.',
      'Le délai et le coût d’envoi vous sont confirmés par e-mail au moment de la réservation, avant tout paiement.',
    ],
  },
  {
    slug: 'retours',
    titre: 'Retours',
    paragraphes: [
      'Une pièce arrivée abîmée ? Écrivez-nous avec une photo du colis et de la pièce : nous trouvons une solution avec vous.',
      `Contact : ${brand.contact.email}`,
    ],
  },
  {
    slug: 'cgv',
    titre: 'Conditions générales de vente',
    paragraphes: [
      'Texte à fournir par la société avant la mise en ligne : réservation, paiement, livraison, droit de rétractation, garanties.',
    ],
  },
  {
    slug: 'mentions-legales',
    titre: 'Mentions légales',
    paragraphes: [
      'Texte à fournir par la société avant la mise en ligne : raison sociale, adresse, SIRET, directeur de la publication, hébergeur.',
    ],
  },
  {
    slug: 'artisan-partenaire',
    titre: 'Devenir artisan partenaire',
    paragraphes: [
      'Vous tournez, modelez ou peignez la céramique en Algérie ? Nous cherchons des ateliers qui signent leurs pièces et acceptent qu’elles ne soient jamais deux fois identiques.',
      `Écrivez-nous à ${brand.contact.email} avec quelques photos de votre travail et le nom de votre ville.`,
    ],
  },
];
