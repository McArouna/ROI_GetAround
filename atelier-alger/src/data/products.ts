import { PRIX_PLACEHOLDER } from './brand';
import type { CategorieId } from './categories';

/**
 * Catalogue produit.
 *
 * Ajouter un produit = ajouter un objet dans `products` ci-dessous
 * (voir README → « Ajouter un produit »). Le slug `id` sert d’URL :
 * /produits/<id>.
 *
 * Le bloc `commerce` est volontairement présent dès le MVP : il accueillera
 * l’identifiant Shopify / le price ID Stripe sans refonte du type ni des pages.
 */
export interface Product {
  /** Slug URL, en minuscules, sans accent. */
  id: string;
  nom: string;
  /** Accent arabe facultatif, affiché en Noto Naskh Arabic. */
  nomArabe?: string;
  categorie: CategorieId;
  /** Référence vers src/data/artisans.ts. */
  artisan: string;
  /** Lieu de fabrication de la pièce (peut différer de la ville de l’atelier). */
  ville: string;
  /** 1 à 2 phrases — sert de résumé sur la carte et de meta description. */
  description: string;
  /** Texte long de la page produit. */
  descriptionLongue: string;
  /** Placeholder tant que la grille tarifaire n’est pas arrêtée. */
  prix: string;
  /**
   * Chemin de base dans /public/products/, SANS extension : le pipeline
   * d'images produit `<base>.webp`, `<base>@2x.webp` et les replis PNG.
   * Tant que rien n'est livré, le cadre affiche un repère au même format.
   */
  image: string;
  /** Vues supplémentaires de la galerie produit. */
  galerie: string[];
  /** Mise en avant sur la page d’accueil. */
  vedette?: boolean;
  tracabilite: {
    argile: string;
    technique: string;
    cuisson: string;
    dimensions: string;
    entretien: string;
  };
  /** Brique commerce — phase ultérieure. */
  commerce: {
    sku: string;
    devise: 'EUR';
    /** 'unique' : pièce unique ; 'serie' : refaite à la demande. */
    disponibilite: 'unique' | 'serie';
    /** À remplir le jour de la connexion Shopify / Stripe. */
    referenceExterne: string | null;
  };
}

const commerce = (
  sku: string,
  disponibilite: Product['commerce']['disponibilite'] = 'unique',
): Product['commerce'] => ({
  sku,
  devise: 'EUR',
  disponibilite,
  referenceExterne: null,
});

export const products: Product[] = [
  /* ----------------------------- Mugs & tasses ---------------------------- */
  {
    id: 'tasse-tanit',
    nom: 'Tasse Tanit',
    categorie: 'mugs',
    artisan: 'nawel',
    ville: 'Maatkas',
    description:
      'Le signe de Tanit encadré de deux traits noirs, sur blanc mat, et le bas de la panse trempé dans un bain turquoise.',
    descriptionLongue:
      'Le signe est tracé d’un seul geste, sans repentir possible : l’émail boit l’oxyde immédiatement. C’est ce qui explique que deux tasses Tanit ne se ressemblent jamais tout à fait — l’une a le bras plus haut, l’autre le trait plus épais. Le turquoise est un trempage : la tasse est plongée à l’envers, tenue par le pied, et la ligne s’arrête où la main a arrêté le geste — jamais tout à fait droite. L’anse, large et ronde, est montée à part puis lissée à l’éponge humide.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/tasse-tanit',
    galerie: ['/products/tasse-tanit-2', '/products/tasse-tanit-3'],
    vedette: true,
    tracabilite: {
      argile: 'Terre blanche chamottée, [carrière à préciser]',
      technique: 'Colombin, décor aux oxydes, bas de panse trempé',
      cuisson: 'Deux cuissons, [1 020 °C] puis [980 °C]',
      dimensions: '[H 9 cm — Ø 8 cm — 250 ml]',
      entretien: 'Lavage à la main, eau tiède, sans abrasif',
    },
    commerce: commerce('MUG-TAN-01'),
  },
  {
    id: 'mug-sabah-el-kheir',
    nom: 'Mug Sabah el-Kheir',
    nomArabe: 'صباح الخير',
    categorie: 'mugs',
    artisan: 'yasmine',
    ville: 'Alger',
    description:
      'Bonjour, en calligraphie, écrit à la main autour du mug. On le lit en tournant la tasse.',
    descriptionLongue:
      'La calligraphie fait le tour complet du mug : impossible de la lire d’un coup d’œil, il faut faire tourner la pièce entre ses doigts. Le trait est posé au pinceau biseauté, plein et délié, sur un fond crème légèrement nuageux — l’émail n’est pas pulvérisé mais versé, il laisse des variations.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/mug-sabah-el-kheir',
    galerie: ['/products/mug-sabah-el-kheir-2'],
    vedette: true,
    tracabilite: {
      argile: 'Faïence blanche, [fournisseur à préciser]',
      technique: 'Tournage, calligraphie au pinceau biseauté',
      cuisson: 'Biscuit [960 °C], émail [1 020 °C]',
      dimensions: '[H 10 cm — Ø 8,5 cm — 300 ml]',
      entretien: 'Lavage à la main, eau tiède, sans abrasif',
    },
    commerce: commerce('MUG-SAB-01', 'serie'),
  },
  {
    id: 'tasse-khamsa',
    nom: 'Tasse Khamsa',
    nomArabe: 'خمسة',
    categorie: 'mugs',
    artisan: 'yasmine',
    ville: 'Alger',
    description:
      'Une main de Fatma bleue au fond de la tasse : elle apparaît quand le café est bu.',
    descriptionLongue:
      'Le décor n’est pas sur la paroi mais au fond, comme un mot qu’on laisse à celui qui finit sa tasse. Bleu de cobalt sur blanc, cerné d’un filet fin. L’extérieur reste nu, à peine satiné, pour qu’on sente la terre sous les doigts.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/tasse-khamsa',
    galerie: ['/products/tasse-khamsa-2'],
    tracabilite: {
      argile: 'Faïence blanche, [fournisseur à préciser]',
      technique: 'Tournage, décor cobalt sous émail',
      cuisson: 'Deux cuissons, [1 020 °C]',
      dimensions: '[H 6 cm — Ø 7 cm — 120 ml]',
      entretien: 'Lavage à la main, eau tiède, sans abrasif',
    },
    commerce: commerce('MUG-KHA-01'),
  },

  /* --------------------------------- Bols --------------------------------- */
  {
    id: 'bol-ocre-du-hoggar',
    nom: 'Bol Ocre du Hoggar',
    categorie: 'bols',
    artisan: 'nawel',
    ville: 'Maatkas',
    description:
      'Un dégradé de terre cuite qui monte du pied vers le bord, coupé de chevrons peints à la main.',
    descriptionLongue:
      'Le dégradé n’est pas imprimé : l’engobe est appliqué en plusieurs passes, de plus en plus diluées, de sorte que la couleur s’efface vers le haut. Les chevrons sont ceux des poteries de Kabylie, tracés au peigne de bois avant la première cuisson.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/bol-ocre-du-hoggar',
    galerie: ['/products/bol-ocre-du-hoggar-2', '/products/bol-ocre-du-hoggar-3'],
    vedette: true,
    tracabilite: {
      argile: 'Terre rouge locale, [carrière à préciser]',
      technique: 'Colombin, engobes superposés, peigne de bois',
      cuisson: 'Cuisson unique, [1 040 °C]',
      dimensions: '[H 7 cm — Ø 14 cm]',
      entretien: 'Lavage à la main ; intérieur émaillé alimentaire',
    },
    commerce: commerce('BOL-HOG-01'),
  },
  {
    id: 'coffret-bols-tassili',
    nom: 'Coffret de bols Tassili',
    categorie: 'bols',
    artisan: 'nawel',
    ville: 'Maatkas',
    description:
      'Quatre bols empilables, quatre signes différents, dans un coffret de bois clair. Le cadeau de mariage.',
    descriptionLongue:
      'Les quatre bols sont tournés au même gabarit pour s’emboîter, mais chacun reçoit un signe distinct — losange, peigne, chevron, point d’eau — tiré du répertoire des peintures rupestres du Tassili. Empilés, ils forment une colonne qu’on laisse sur le plan de travail.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/coffret-bols-tassili',
    galerie: ['/products/coffret-bols-tassili-2', '/products/coffret-bols-tassili-3'],
    tracabilite: {
      argile: 'Terre rouge locale, [carrière à préciser]',
      technique: 'Colombin, décor aux oxydes, coffret bois [essence à préciser]',
      cuisson: 'Cuisson unique, [1 040 °C]',
      dimensions: '[4 bols — H 6 cm — Ø 12 cm]',
      entretien: 'Lavage à la main ; coffret à essuyer à sec',
    },
    commerce: commerce('BOL-TAS-04'),
  },
  {
    id: 'bol-peche-et-signes',
    nom: 'Bol Pêche & Signes',
    categorie: 'bols',
    artisan: 'karim',
    ville: 'Ghardaïa',
    description: 'Rose pêche mat à l’extérieur, signes tribaux noirs à l’intérieur, sur fond nu.',
    descriptionLongue:
      'Le contraste est volontaire : dehors une couleur douce, presque poudrée, dedans un graphisme net qui se découvre au fur et à mesure qu’on vide le bol. Le pied est laissé brut, non émaillé, pour qu’on voie la terre.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/bol-peche-et-signes',
    galerie: ['/products/bol-peche-et-signes-2'],
    tracabilite: {
      argile: 'Grès chamotté, [carrière à préciser]',
      technique: 'Tournage, émail mat, décor pinceau',
      cuisson: 'Grès, [1 240 °C]',
      dimensions: '[H 8 cm — Ø 15 cm]',
      entretien: 'Lave-vaisselle déconseillé',
    },
    commerce: commerce('BOL-PEC-01', 'serie'),
  },

  /* ------------------------------- Tajines -------------------------------- */
  {
    id: 'tajine-fleurs-de-nedroma',
    nom: 'Tajine Fleurs de Nedroma',
    categorie: 'tajines',
    artisan: 'sofiane',
    ville: 'Nedroma',
    description:
      'Couvercle conique couvert de fleurs peintes, plat et bord unis. Décoratif — il ne va pas sur le feu.',
    descriptionLongue:
      'Le bouquet part de la pointe du couvercle et descend en spirale jusqu’au bord : il faut tourner la pièce pendant qu’on peint, ce que [Sofiane] fait sur une girelle de bois. Les couleurs sont posées à plat, puis cernées d’un trait brun qui les tient. Pièce décorative : elle se pose au centre de la table, garnie de dattes ou de gâteaux.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/tajine-fleurs-de-nedroma',
    galerie: [
      '/products/tajine-fleurs-de-nedroma-2',
      '/products/tajine-fleurs-de-nedroma-3',
    ],
    vedette: true,
    tracabilite: {
      argile: 'Terre de [Nedroma], tamisée à l’atelier',
      technique: 'Tournage, décor polychrome sur émail cru',
      cuisson: 'Deux cuissons, [960 °C] puis [1 000 °C]',
      dimensions: '[H 24 cm — Ø 26 cm]',
      entretien: 'Décoratif — ne pas passer au feu ni au four',
    },
    commerce: commerce('TAJ-NED-01'),
  },
  {
    id: 'tajine-dhahab',
    nom: 'Tajine Dhahab',
    nomArabe: 'ذهب',
    categorie: 'tajines',
    artisan: 'sofiane',
    ville: 'Nedroma',
    description: 'Fond ivoire, rehauts d’or posés à la troisième cuisson sur les arêtes du couvercle.',
    descriptionLongue:
      'L’or est un lustre, appliqué après l’émail et refixé à basse température : c’est la troisième fois que la pièce entre au four, et la plus risquée. Une coulure, un doigt posé au mauvais endroit, et la pièce est écartée. Ce qui arrive à la table a donc passé trois fois l’épreuve du feu.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/tajine-dhahab',
    galerie: ['/products/tajine-dhahab-2'],
    tracabilite: {
      argile: 'Terre de [Nedroma], tamisée à l’atelier',
      technique: 'Tournage, émail ivoire, lustre or au pinceau',
      cuisson: 'Trois cuissons, dernière à [740 °C]',
      dimensions: '[H 22 cm — Ø 24 cm]',
      entretien: 'Décoratif — essuyer à sec, jamais d’éponge abrasive',
    },
    commerce: commerce('TAJ-DHA-01'),
  },

  /* --------------------------- Assiettes & plats -------------------------- */
  {
    id: 'assiette-etoile-de-bejaia',
    nom: 'Assiette Étoile de Béjaïa',
    categorie: 'assiettes',
    artisan: 'mehdi',
    ville: 'Tlemcen',
    description: 'Étoile à huit branches au centre, bord bleu profond tiré au pinceau plat.',
    descriptionLongue:
      'L’étoile est construite au compas sur la terre crue, puis peinte à main levée : les branches ne sont pas parfaitement égales et c’est ce qui la sauve de l’effet industriel. Le bord est passé d’un seul mouvement, l’assiette tournant sous le pinceau.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/assiette-etoile-de-bejaia',
    galerie: ['/products/assiette-etoile-de-bejaia-2'],
    vedette: true,
    tracabilite: {
      argile: 'Faïence blanche, [fournisseur à préciser]',
      technique: 'Calibrage, tracé au compas, décor grand feu',
      cuisson: 'Deux cuissons, [1 020 °C]',
      dimensions: '[Ø 27 cm]',
      entretien: 'Lavage à la main ; contact alimentaire',
    },
    commerce: commerce('ASS-BEJ-01', 'serie'),
  },
  {
    id: 'plat-bord-safran',
    nom: 'Plat Bord Safran',
    categorie: 'assiettes',
    artisan: 'sofiane',
    ville: 'Nedroma',
    description: 'Grand plat de service, centre nu, large bord safran griffé de traits noirs.',
    descriptionLongue:
      'Le centre est laissé vide pour la nourriture — un plat de service n’a pas besoin d’être chargé là où on pose le couscous. Tout le décor se concentre sur le bord : un aplat safran, puis des traits noirs tirés d’un coup de poignet, irréguliers de façon assumée.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/plat-bord-safran',
    galerie: ['/products/plat-bord-safran-2'],
    tracabilite: {
      argile: 'Terre de [Nedroma], tamisée à l’atelier',
      technique: 'Calibrage, aplat et traits au pinceau',
      cuisson: 'Deux cuissons, [1 000 °C]',
      dimensions: '[Ø 34 cm]',
      entretien: 'Lavage à la main ; contact alimentaire',
    },
    commerce: commerce('ASS-SAF-01'),
  },

  /* ------------------------ Plateaux à pâtisseries ------------------------ */
  {
    id: 'plateau-baklawa',
    nom: 'Plateau Baklawa',
    nomArabe: 'بقلاوة',
    categorie: 'plateaux',
    artisan: 'lilia',
    ville: 'Constantine',
    description:
      'Les losanges de baklawa peints un à un sur la faïence, amande dorée au centre. Notre pièce signature.',
    descriptionLongue:
      'Chaque losange est peint séparément, dans l’ordre où on les range vraiment sur un plateau de fête : rangs serrés, décalés d’un demi-pas. L’amande centrale reçoit un point de lustre doré. De loin on croit voir des gâteaux ; de près, on voit le pinceau. C’est exactement l’effet recherché.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/plateau-baklawa',
    galerie: ['/products/plateau-baklawa-2', '/products/plateau-baklawa-3'],
    vedette: true,
    tracabilite: {
      argile: 'Faïence blanche, [fournisseur à préciser]',
      technique: 'Calibrage, illustration au pinceau fin, lustre or',
      cuisson: 'Trois cuissons, dernière à [740 °C]',
      dimensions: '[Ø 32 cm]',
      entretien: 'Lavage à la main, sans abrasif (rehauts d’or)',
    },
    commerce: commerce('PLA-BAK-01'),
  },
  {
    id: 'plateau-makrout-griwech',
    nom: 'Plateau Makrout & Griwech',
    categorie: 'plateaux',
    artisan: 'lilia',
    ville: 'Constantine',
    description:
      'Deux gâteaux, deux moitiés de plateau : le makrout en rangs, le griwech en couronne de miel.',
    descriptionLongue:
      'Le plateau est partagé en deux comme le sont les vrais plateaux de l’Aïd, quand on refuse de choisir. À gauche les makrouts en rangs serrés, semoule et datte ; à droite les griwech enroulés, luisants de miel, peints par touches transparentes superposées pour rendre le brillant sans lustre.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/plateau-makrout-griwech',
    galerie: ['/products/plateau-makrout-griwech-2'],
    vedette: true,
    tracabilite: {
      argile: 'Faïence blanche, [fournisseur à préciser]',
      technique: 'Calibrage, illustration au pinceau fin, glacis superposés',
      cuisson: 'Deux cuissons, [1 020 °C]',
      dimensions: '[L 36 cm — l 24 cm]',
      entretien: 'Lavage à la main, eau tiède',
    },
    commerce: commerce('PLA-MAK-01'),
  },
  {
    id: 'plateau-bourek-du-vendredi',
    nom: 'Plateau Bourek du vendredi',
    categorie: 'plateaux',
    artisan: 'lilia',
    ville: 'Constantine',
    description:
      'Des cigares de bourek dorés, peints en éventail, pour le plateau qu’on sort avant la chorba.',
    descriptionLongue:
      'Les bourek sont disposés en éventail, comme on les dresse à la sortie de la friture, et la faïence garde son blanc entre eux pour donner de l’air au dessin. Un filet brun cerne le bord, sans plus : le sujet est déjà chargé.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/plateau-bourek-du-vendredi',
    galerie: ['/products/plateau-bourek-du-vendredi-2'],
    tracabilite: {
      argile: 'Faïence blanche, [fournisseur à préciser]',
      technique: 'Calibrage, illustration au pinceau fin',
      cuisson: 'Deux cuissons, [1 020 °C]',
      dimensions: '[L 34 cm — l 22 cm]',
      entretien: 'Lavage à la main, eau tiède',
    },
    commerce: commerce('PLA-BOU-01', 'serie'),
  },

  /* --------------------------- Gourdes & qraba ---------------------------- */
  {
    id: 'qraba-casbah',
    nom: 'Qraba Casbah',
    nomArabe: 'قربة',
    categorie: 'gourdes',
    artisan: 'yasmine',
    ville: 'Alger',
    description:
      'Une ruelle entière peinte sur une face : porte cloutée à encadrement de zellige, arcades, escaliers, et deux femmes en haïk qui descendent.',
    descriptionLongue:
      'La forme vient des gourdes qu’on emportait aux champs : panse plate, col court, petite anse percée. [Yasmine] y peint une ruelle réelle, du sol vers le haut — le calepinage des pavés d’abord, puis les femmes en haïk, puis les arcades et le linge de lumière au fond. Le col reçoit une frise bleue en chevrons, seule géométrie d’une pièce qui, pour le reste, est une scène. Le blanc du fond n’est pas peint : c’est l’émail laissé nu.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/qraba-casbah',
    galerie: ['/products/qraba-casbah-2', '/products/qraba-casbah-3'],
    vedette: true,
    tracabilite: {
      argile: 'Terre rouge, [carrière à préciser]',
      technique: 'Panse plate montée en deux plaques, décor polychrome au pinceau fin',
      cuisson: 'Deux cuissons, [1 020 °C]',
      dimensions: '[H 24 cm — l 18 cm — ép. 7 cm]',
      entretien: 'Décorative — ne pas remplir durablement',
    },
    commerce: commerce('GOU-CAS-01'),
  },
  {
    id: 'qraba-el-khat',
    nom: 'Qraba El Khat',
    nomArabe: 'خط',
    categorie: 'gourdes',
    artisan: 'yasmine',
    ville: 'Alger',
    description:
      'Des lettres brunes enchevêtrées sur toute la panse, comme sur les planches d’exercice des calligraphes. Bouchon de liège.',
    descriptionLongue:
      'Ce n’est pas une phrase : ce sont des lettres, posées les unes sur les autres jusqu’à saturer la surface, comme les calligraphes le font sur leurs planches d’entraînement. On y reconnaît des alifs, des sâds, des points — mais rien à lire. La couleur est une seule terre brune, diluée plus ou moins selon la largeur du trait. Le liège est taillé à la main, pièce par pièce, car aucun col n’a tout à fait le même diamètre.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/qraba-el-khat',
    galerie: ['/products/qraba-el-khat-2', '/products/qraba-el-khat-3'],
    vedette: true,
    tracabilite: {
      argile: 'Faïence blanche, [fournisseur à préciser]',
      technique: 'Panse plate montée en deux plaques, calligraphie au pinceau biseauté',
      cuisson: 'Deux cuissons, [1 020 °C]',
      dimensions: '[H 24 cm — l 18 cm — ép. 7 cm]',
      entretien: 'Décorative — essuyer à sec, bouchon à retirer avant nettoyage',
    },
    commerce: commerce('GOU-KHA-01'),
  },
  {
    id: 'qraba-zahra',
    nom: 'Qraba Zahra',
    nomArabe: 'زهرة',
    categorie: 'gourdes',
    artisan: 'sofiane',
    ville: 'Nedroma',
    description:
      'Un champ de fleurs roses à cœur grenat, feuilles vertes en épis, couvrant la panse d’un bord à l’autre.',
    descriptionLongue:
      'Chaque fleur part du cœur : un point grenat, puis les pétales tirés vers l’extérieur d’un coup de pinceau qui s’allège en finissant. Les feuilles sont posées entre elles, en épis, pour combler le blanc sans jamais le fermer tout à fait. [Sofiane] en peint une vingtaine par face et ne les compte pas : il s’arrête quand la panse est pleine.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/qraba-zahra',
    galerie: ['/products/qraba-zahra-2'],
    vedette: true,
    tracabilite: {
      argile: 'Faïence blanche, [fournisseur à préciser]',
      technique: 'Panse plate montée en deux plaques, décor floral au pinceau',
      cuisson: 'Deux cuissons, [1 020 °C]',
      dimensions: '[H 24 cm — l 18 cm — ép. 7 cm]',
      entretien: 'Décorative — essuyer à sec, bouchon à retirer avant nettoyage',
    },
    commerce: commerce('GOU-ZAH-01'),
  },
  {
    id: 'gourde-haik',
    nom: 'Gourde Haïk',
    categorie: 'gourdes',
    artisan: 'yasmine',
    ville: 'Alger',
    description:
      'Une silhouette en haïk blanc sur fond ardoise : la pièce se lit comme une estampe.',
    descriptionLongue:
      'Le haïk est obtenu en réserve : l’émail blanc reste nu, c’est le fond sombre peint autour qui dessine la silhouette. Il n’y a donc aucun trait blanc — seulement du vide correctement placé, ce qui est bien plus difficile.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/gourde-haik',
    galerie: ['/products/gourde-haik-2'],
    tracabilite: {
      argile: 'Terre rouge, [carrière à préciser]',
      technique: 'Tournage, décor en réserve',
      cuisson: 'Deux cuissons, [1 020 °C]',
      dimensions: '[H 26 cm — Ø 16 cm]',
      entretien: 'Décorative — essuyer à sec',
    },
    commerce: commerce('GOU-HAI-01'),
  },
  {
    id: 'qraba-emaillee-bleu-alger',
    nom: 'Qraba émaillée Bleu d’Alger',
    categorie: 'gourdes',
    artisan: 'karim',
    ville: 'Ghardaïa',
    description: 'Sans décor peint : un seul bleu, épais, qui coule et s’épaissit au bas de la panse.',
    descriptionLongue:
      'Ici, l’émail fait tout le travail. Versé sur la pièce tenue par le col, il descend seul et s’accumule au ras du pied, où il vire au bleu presque noir. Deux gourdes trempées le même jour ne coulent jamais pareil.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/qraba-emaillee-bleu-alger',
    galerie: ['/products/qraba-emaillee-bleu-alger-2'],
    tracabilite: {
      argile: 'Grès chamotté, [carrière à préciser]',
      technique: 'Tournage, émail versé',
      cuisson: 'Grès, [1 250 °C]',
      dimensions: '[H 30 cm — Ø 19 cm]',
      entretien: 'Décorative — essuyer à sec',
    },
    commerce: commerce('GOU-BLE-01'),
  },

  /* -------------------------- Pichets & carafes --------------------------- */
  {
    id: 'pichet-rayures-de-ghardaia',
    nom: 'Pichet Rayures de Ghardaïa',
    categorie: 'pichets',
    artisan: 'karim',
    ville: 'Ghardaïa',
    description: 'Rayures horizontales tirées pendant que la pièce tourne encore. Bec pincé au pouce.',
    descriptionLongue:
      'Les rayures sont posées sur le tour, pinceau tenu immobile pendant que la pièce défile : la largeur varie avec la vitesse, ce qui donne ces bandes qui respirent. Le bec est tiré au pouce, à main levée, dernier geste avant le séchage.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/pichet-rayures-de-ghardaia',
    galerie: ['/products/pichet-rayures-de-ghardaia-2'],
    vedette: true,
    tracabilite: {
      argile: 'Grès chamotté, [carrière à préciser]',
      technique: 'Tournage, rayures au tour',
      cuisson: 'Grès, [1 250 °C]',
      dimensions: '[H 22 cm — 1,1 L]',
      entretien: 'Contact alimentaire ; lavage à la main',
    },
    commerce: commerce('PIC-GHA-01', 'serie'),
  },
  {
    id: 'carafe-ligne-blanche',
    nom: 'Carafe Ligne Blanche',
    categorie: 'pichets',
    artisan: 'karim',
    ville: 'Ghardaïa',
    description: 'Une carafe haute, blanche, barrée d’un seul trait d’argile nue à mi-hauteur.',
    descriptionLongue:
      'Une seule ligne : l’émail s’arrête net à mi-corps, la terre reste apparente sur deux centimètres, puis l’émail reprend. La ligne est tracée à la cire avant trempage — une fois posée, on ne revient pas dessus.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/carafe-ligne-blanche',
    galerie: ['/products/carafe-ligne-blanche-2'],
    tracabilite: {
      argile: 'Grès blanc, [fournisseur à préciser]',
      technique: 'Tournage, réserve à la cire',
      cuisson: 'Grès, [1 250 °C]',
      dimensions: '[H 26 cm — 1,4 L]',
      entretien: 'Contact alimentaire ; lavage à la main',
    },
    commerce: commerce('PIC-LIG-01', 'serie'),
  },

  /* --------------------------- Carreaux & zellige ------------------------- */
  {
    id: 'carreau-zellige-etoile',
    nom: 'Carreau Zellige Étoile',
    categorie: 'zellige',
    artisan: 'mehdi',
    ville: 'Tlemcen',
    description:
      'Un carreau émaillé à la main, à poser seul sur un meuble ou à assembler en panneau.',
    descriptionLongue:
      'Découpé à la main puis émaillé un par un, le carreau garde des bords légèrement irréguliers et une épaisseur qui varie de quelques dixièmes. Posés côte à côte, ces écarts accrochent la lumière : c’est ce qui distingue un zellige d’un carrelage.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/carreau-zellige-etoile',
    galerie: ['/products/carreau-zellige-etoile-2'],
    tracabilite: {
      argile: 'Terre rouge, [carrière à préciser]',
      technique: 'Découpe à la main, émaillage pièce à pièce',
      cuisson: 'Deux cuissons, [1 000 °C]',
      dimensions: '[10 × 10 cm — ép. 1,2 cm]',
      entretien: 'Essuyer à l’éponge humide',
    },
    commerce: commerce('ZEL-ETO-01', 'serie'),
  },
  {
    id: 'planche-zellige',
    nom: 'Planche Zellige',
    categorie: 'zellige',
    artisan: 'mehdi',
    ville: 'Tlemcen',
    description:
      'Une planche de service en céramique, motif zellige, bord en bois pour la prendre à deux mains.',
    descriptionLongue:
      'Le plateau céramique est serti dans un cadre de bois qui sert de préhension et protège les arêtes. On y pose le pain, les olives, le fromage — et on la repose telle quelle sur la table, sans dressage.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/planche-zellige',
    galerie: ['/products/planche-zellige-2'],
    tracabilite: {
      argile: 'Terre rouge, [carrière à préciser]',
      technique: 'Carreaux assemblés, cadre bois [essence à préciser]',
      cuisson: 'Deux cuissons, [1 000 °C]',
      dimensions: '[L 40 cm — l 20 cm]',
      entretien: 'Céramique lavable ; cadre bois à essuyer à sec',
    },
    commerce: commerce('ZEL-PLA-01'),
  },

  /* ---------------- Mains de Fatma & repose-cuillères --------------------- */
  {
    id: 'main-de-fatma-murale',
    nom: 'Main de Fatma murale',
    nomArabe: 'خميسة',
    categorie: 'mains',
    artisan: 'yasmine',
    ville: 'Alger',
    description: 'Une khamsa plate à accrocher à l’entrée, œil peint au centre, trou de suspension cuit.',
    descriptionLongue:
      'Découpée à la mirette dans une plaque d’argile, la main garde l’épaisseur du rouleau et les traces de la découpe sur la tranche. Le trou de suspension est percé avant cuisson, jamais après — une céramique cuite ne se perce plus.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/main-de-fatma-murale',
    galerie: ['/products/main-de-fatma-murale-2'],
    tracabilite: {
      argile: 'Faïence blanche, [fournisseur à préciser]',
      technique: 'Plaque, découpe à la mirette, décor cobalt',
      cuisson: 'Deux cuissons, [1 020 °C]',
      dimensions: '[H 18 cm — l 11 cm]',
      entretien: 'Dépoussiérer au chiffon sec',
    },
    commerce: commerce('MAI-KHA-01', 'serie'),
  },
  {
    id: 'repose-cuillere-khamsa',
    nom: 'Repose-cuillère Khamsa',
    categorie: 'mains',
    artisan: 'nawel',
    ville: 'Maatkas',
    description: 'La petite pièce qui vit près de la marmite : creusée dans la paume, émaillée dedans.',
    descriptionLongue:
      'La paume est creusée au pouce pour retenir le jus de la cuillère, et l’émail ne couvre que ce creux — le reste est laissé mat pour ne pas glisser sur le plan de travail. C’est le premier objet que beaucoup d’entre nous ont offert.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/repose-cuillere-khamsa',
    galerie: ['/products/repose-cuillere-khamsa-2'],
    tracabilite: {
      argile: 'Grès chamotté, [carrière à préciser]',
      technique: 'Plaque estampée, émail partiel',
      cuisson: 'Grès, [1 240 °C]',
      dimensions: '[L 14 cm — l 8 cm]',
      entretien: 'Contact alimentaire ; lavage à la main',
    },
    commerce: commerce('MAI-REP-01', 'serie'),
  },

  /* ------------------------------- Savons --------------------------------- */
  {
    id: 'savon-fleur-oranger',
    nom: 'Savon Fleur d’oranger',
    nomArabe: 'زهر',
    categorie: 'savons',
    artisan: 'amina',
    ville: 'Béjaïa',
    description:
      'Saponifié à froid, séché six semaines, rangé dans une boîte métal illustrée à la main.',
    descriptionLongue:
      'Le savon est coulé à froid puis mis à sécher six semaines sur claies — c’est ce temps-là qui le rend dur et durable. La boîte métal, illustrée d’un motif de zellige et d’une branche de néroli, se garde bien après : couture, épices, petites choses.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/savon-fleur-oranger',
    galerie: ['/products/savon-fleur-oranger-2'],
    tracabilite: {
      argile: 'Sans céramique — huiles végétales [composition à préciser]',
      technique: 'Saponification à froid, boîte métal illustrée',
      cuisson: 'Séchage [6 semaines] à l’air libre',
      dimensions: '[100 g — boîte 9 × 6 cm]',
      entretien: 'Conserver au sec, sur un porte-savon drainant',
    },
    commerce: commerce('SAV-ORA-01', 'serie'),
  },
  {
    id: 'savon-figue-de-barbarie',
    nom: 'Savon Figue de Barbarie',
    categorie: 'savons',
    artisan: 'amina',
    ville: 'Béjaïa',
    description: 'Un savon vert pâle à l’huile de figue de barbarie, boîte illustrée de raquettes et d’épines.',
    descriptionLongue:
      'L’huile de pépins de figue de barbarie entre en fin de cuisson pour ne pas être dénaturée. La boîte reprend le motif des haies de cactus qui bordent les chemins — raquettes serrées, fruits ronds, épines à l’encre fine.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/savon-figue-de-barbarie',
    galerie: ['/products/savon-figue-de-barbarie-2'],
    tracabilite: {
      argile: 'Sans céramique — huiles végétales [composition à préciser]',
      technique: 'Saponification à froid, boîte métal illustrée',
      cuisson: 'Séchage [6 semaines] à l’air libre',
      dimensions: '[100 g — boîte 9 × 6 cm]',
      entretien: 'Conserver au sec, sur un porte-savon drainant',
    },
    commerce: commerce('SAV-FIG-01', 'serie'),
  },

  /* ------------------------------ Art mural -------------------------------- */
  {
    id: 'def-peint',
    nom: 'Def peint',
    nomArabe: 'دف',
    categorie: 'art-mural',
    artisan: 'lilia',
    ville: 'Constantine',
    description:
      'Un tambourin d’atelier peint sur peau : motif central, cercle de signes, à accrocher au mur.',
    descriptionLongue:
      'Le def est monté par un facteur d’instruments, puis peint à plat, peau tendue. Le motif central est posé en premier, le cercle de signes ensuite, à distance régulière contrôlée à l’œil. Il reste jouable, même si la plupart finissent au mur.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/def-peint',
    galerie: ['/products/def-peint-2'],
    vedette: true,
    tracabilite: {
      argile: 'Sans céramique — bois et peau [origine à préciser]',
      technique: 'Montage artisanal, peinture sur peau tendue',
      cuisson: 'Sans cuisson',
      dimensions: '[Ø 30 cm]',
      entretien: 'Tenir à l’écart de l’humidité',
    },
    commerce: commerce('ART-DEF-01'),
  },
  {
    id: 'cadre-portes-de-la-casbah',
    nom: 'Cadre Portes de la Casbah',
    categorie: 'art-mural',
    artisan: 'yasmine',
    ville: 'Alger',
    description: 'Quatre carreaux peints, quatre portes cloutées, montés dans un cadre de bois brut.',
    descriptionLongue:
      'Quatre portes réelles, relevées dans la haute Casbah et repeintes carreau par carreau : le heurtoir en main de Fatma, les clous en quinconce, le bleu passé par le soleil. Le cadre est laissé brut pour ne pas concurrencer la couleur.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/cadre-portes-de-la-casbah',
    galerie: ['/products/cadre-portes-de-la-casbah-2'],
    tracabilite: {
      argile: 'Faïence blanche, [fournisseur à préciser]',
      technique: 'Carreaux peints à la main, cadre bois [essence à préciser]',
      cuisson: 'Deux cuissons, [1 020 °C]',
      dimensions: '[H 30 cm — l 30 cm]',
      entretien: 'Dépoussiérer au chiffon sec',
    },
    commerce: commerce('ART-CAS-01'),
  },
  {
    id: 'affiche-alger-la-blanche',
    nom: 'Affiche Alger la Blanche',
    nomArabe: 'الجزائر البيضاء',
    categorie: 'art-mural',
    artisan: 'lilia',
    ville: 'Constantine',
    description:
      'La baie, les arcades blanches et le bleu du port, dessinés à la main puis imprimés à l’encre pigmentaire.',
    descriptionLongue:
      'Le dessin original est peint à la gouache, puis numérisé et imprimé en tirage limité sur papier de coton. C’est la seule pièce reproductible du catalogue — et elle est numérotée à la main, une par une.',
    prix: PRIX_PLACEHOLDER,
    image: '/products/affiche-alger-la-blanche',
    galerie: ['/products/affiche-alger-la-blanche-2'],
    tracabilite: {
      argile: 'Sans céramique — papier coton [300 g]',
      technique: 'Gouache originale, impression pigmentaire, numérotée à la main',
      cuisson: 'Sans cuisson',
      dimensions: '[30 × 40 cm]',
      entretien: 'Encadrer sous verre, à l’abri du soleil direct',
    },
    commerce: commerce('ART-AFF-01', 'serie'),
  },
];

/** Produits mis en avant sur la page d’accueil. */
export const produitsVedette = products.filter((p) => p.vedette);

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function produitsParCategorie(categorie: CategorieId): Product[] {
  return products.filter((p) => p.categorie === categorie);
}

/** Toutes les images attendues dans /public/products/ (utilisé par le README). */
export function toutesLesImages(): string[] {
  return products.flatMap((p) => [p.image, ...p.galerie]);
}
