# Atelier Alger — site vitrine & catalogue (MVP)

Site vitrine et catalogue d’une marque de céramique algérienne peinte à la main,
destinée à la diaspora maghrébine en France.

**Objectif du MVP :** démontrer la direction artistique et présenter le catalogue.
**Pas de paiement en ligne** à ce stade : la réservation se fait par e-mail, mais la
structure produit est prête à accueillir Shopify ou Stripe sans refonte (voir
« Phase 2 » plus bas).

- Astro 7 + Tailwind CSS 4 + TypeScript
- Sortie 100 % statique (`dist/`), déployable sur Vercel, Netlify ou tout hébergeur de fichiers
- 29 pièces réparties en 11 familles d’objets, dont 4 déjà photographiées
- Aucune image tierce : chaque visuel est un **placeholder au format exact** de la photo à venir

---

## 1. Lancer le projet

```bash
cd atelier-alger
npm install
npm run dev        # http://localhost:4321
```

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | génère le site statique dans `dist/` |
| `npm run preview` | prévisualise le contenu de `dist/` |
| `npm run check` | vérification TypeScript / Astro (doit rester à 0 erreur) |
| `npm run photos` | liste les photos encore manquantes dans `public/products/` |

### Déploiement

Le dépôt contient aussi, à sa racine, un ancien outil sans rapport : **la racine du projet
à déployer est le dossier `atelier-alger/`.**

- **Vercel** — Framework : Astro · Root Directory : `atelier-alger` · Build : `npm run build` · Output : `dist`
- **Netlify** — Base directory : `atelier-alger` · Build : `npm run build` · Publish : `atelier-alger/dist`

---

## 2. Où déposer les photos

Toutes les photos vont dans **`public/products/`** (les portraits d’artisans dans
`public/products/artisans/`). Aucun code à modifier : tant que le fichier n’existe pas,
le site affiche un placeholder **au bon ratio et à la bonne place** ; dès que le fichier
est déposé au bon nom, la photo le remplace au build suivant.

La page d’accueil met **automatiquement en avant les pièces déjà photographiées** (vignettes du hero et grille « Nos plus belles créations »), via `photosDabord()` dans `src/lib/images.ts` : à mesure que les photos arrivent, la vitrine se remplit sans qu’on touche au code.

```bash
npm run photos          # ce qui manque encore
npm run photos -- --all # l’inventaire complet, présent ou non
```

### Formats attendus

| Emplacement | Ratio | Cadrage conseillé |
| --- | --- | --- |
| Visuel principal de fiche / carte produit | **4 / 5** (portrait) | pièce centrée, fond uni clair |
| Vues secondaires de la galerie produit | **1 / 1** (carré) | détail du décor, dessous signé, profil |
| Vignettes du hero | **1 / 1** | même pièce que la fiche, cadrage serré |
| Grande nature morte du hero (`hero-nature-morte.jpg`) | **4 / 5** | plusieurs pièces groupées, lumière rasante |
| Images de l’atelier (`atelier-mains.jpg`, `atelier-sechage.jpg`) | **3 / 4** | le geste, les mains, le séchage |
| Sortie de four (`sortie-de-four.jpg`) | **4 / 3** | pièces alignées à la sortie du four |
| Portraits d’artisans (`artisans/<prenom>.jpg`) | **3 / 4** | portrait à l’atelier |

JPEG ou WebP, 1600 px sur le grand côté minimum, ≤ 400 Ko après compression.

> Les cinq photos déjà en place font 744 à 941 px de large : suffisant pour la maquette,
> un peu juste sur grand écran. Prévoir les fichiers d’origine avant la mise en ligne.

### Noms de fichiers attendus

Règle : `public/products/<identifiant-du-produit>.jpg` pour le visuel principal,
puis `-2`, `-3` pour la galerie.

| Pièce | Fichiers |
| --- | --- |
| Tasse Tanit | **`tasse-tanit.jpg`** ✓, **`hero-nature-morte.jpg`** ✓, `tasse-tanit-2.jpg` |
| Mug Sabah el-Kheir | `mug-sabah-el-kheir.jpg`, `mug-sabah-el-kheir-2.jpg` |
| Tasse Khamsa | `tasse-khamsa.jpg`, `tasse-khamsa-2.jpg` |
| Bol Ocre du Hoggar | `bol-ocre-du-hoggar.jpg`, `bol-ocre-du-hoggar-2.jpg`, `bol-ocre-du-hoggar-3.jpg` |
| Coffret de bols Tassili | `coffret-bols-tassili.jpg`, `coffret-bols-tassili-2.jpg`, `coffret-bols-tassili-3.jpg` |
| Bol Pêche & Signes | `bol-peche-et-signes.jpg`, `bol-peche-et-signes-2.jpg` |
| Tajine Fleurs de Nedroma | `tajine-fleurs-de-nedroma.jpg`, `tajine-fleurs-de-nedroma-2.jpg`, `tajine-fleurs-de-nedroma-3.jpg` |
| Tajine Dhahab | `tajine-dhahab.jpg`, `tajine-dhahab-2.jpg` |
| Assiette Étoile de Béjaïa | `assiette-etoile-de-bejaia.jpg`, `assiette-etoile-de-bejaia-2.jpg` |
| Plat Bord Safran | `plat-bord-safran.jpg`, `plat-bord-safran-2.jpg` |
| Plateau Baklawa | `plateau-baklawa.jpg`, `plateau-baklawa-2.jpg`, `plateau-baklawa-3.jpg` |
| Plateau Makrout & Griwech | `plateau-makrout-griwech.jpg`, `plateau-makrout-griwech-2.jpg` |
| Plateau Bourek du vendredi | `plateau-bourek-du-vendredi.jpg`, `plateau-bourek-du-vendredi-2.jpg` |
| Qraba Casbah | **`qraba-casbah.jpg`** ✓, `qraba-casbah-2.jpg`, `qraba-casbah-3.jpg` |
| Qraba El Khat | **`qraba-el-khat.jpg`** ✓, **`hero-nature-morte.jpg`** ✓, `qraba-el-khat-2.jpg` |
| Qraba Zahra | **`qraba-zahra.jpg`** ✓, `qraba-zahra-2.jpg` |
| Gourde Haïk | `gourde-haik.jpg`, `gourde-haik-2.jpg` |
| Qraba émaillée Bleu d’Alger | `qraba-emaillee-bleu-alger.jpg`, `qraba-emaillee-bleu-alger-2.jpg` |
| Pichet Rayures de Ghardaïa | `pichet-rayures-de-ghardaia.jpg`, `pichet-rayures-de-ghardaia-2.jpg` |
| Carafe Ligne Blanche | `carafe-ligne-blanche.jpg`, `carafe-ligne-blanche-2.jpg` |
| Carreau Zellige Étoile | `carreau-zellige-etoile.jpg`, `carreau-zellige-etoile-2.jpg` |
| Planche Zellige | `planche-zellige.jpg`, `planche-zellige-2.jpg` |
| Main de Fatma murale | `main-de-fatma-murale.jpg`, `main-de-fatma-murale-2.jpg` |
| Repose-cuillère Khamsa | `repose-cuillere-khamsa.jpg`, `repose-cuillere-khamsa-2.jpg` |
| Savon Fleur d’oranger | `savon-fleur-oranger.jpg`, `savon-fleur-oranger-2.jpg` |
| Savon Figue de Barbarie | `savon-figue-de-barbarie.jpg`, `savon-figue-de-barbarie-2.jpg` |
| Def peint | `def-peint.jpg`, `def-peint-2.jpg` |
| Cadre Portes de la Casbah | `cadre-portes-de-la-casbah.jpg`, `cadre-portes-de-la-casbah-2.jpg` |
| Affiche Alger la Blanche | `affiche-alger-la-blanche.jpg`, `affiche-alger-la-blanche-2.jpg` |

Les fichiers **en gras suivis de ✓** sont déjà en place.

Visuels éditoriaux : `hero-nature-morte.jpg` ✓ (fournie), `atelier-mains.jpg`, `atelier-sechage.jpg`,
`sortie-de-four.jpg`.
Portraits : `artisans/yasmine.jpg`, `artisans/karim.jpg`, `artisans/nawel.jpg`,
`artisans/sofiane.jpg`, `artisans/lilia.jpg`, `artisans/mehdi.jpg`, `artisans/amina.jpg`.

> Ne jamais copier de photo Instagram ou de tiers : toutes les images doivent être
> produites par la marque ou cédées par écrit.

---

## 3. Où changer quoi

| Ce que vous voulez changer | Fichier |
| --- | --- |
| **Nom de la marque** (« Atelier Alger » est provisoire) | `src/data/brand.ts` → `brand.nom` |
| Baseline, accroche, e-mail, téléphone, adresse, réseaux | `src/data/brand.ts` |
| **Prix** (tous en `[PRIX]` aujourd’hui) | `src/data/brand.ts` → `PRIX_PLACEHOLDER`, ou pièce par pièce dans `src/data/products.ts` |
| **Noms des artisan·e·s** (`[Yasmine]`, `[Karim]`…) | `src/data/artisans.ts` — un seul endroit, répercuté partout |
| Catégories et leurs chapeaux | `src/data/categories.ts` |
| Fiches produit (nom, description, traçabilité) | `src/data/products.ts` |
| Menu, liens de pied de page, sélecteur de langue | `src/data/brand.ts` |
| Textes de la page d’accueil (hero, philosophie, valeurs, CTA) | `src/pages/index.astro` |
| **Couleurs, polices, arrondis** | `src/styles/global.css` (bloc `@theme`) |

Tout ce qui est écrit **entre crochets** est un placeholder à remplacer avant la mise en
ligne : `[PRIX]`, `[Yasmine]`, `[+33 6 00 00 00 00]`, `[1 020 °C]`, `[Ø 32 cm]`…
Pour les repérer : `grep -rn "\[" src/data/`.

---

## 4. Ajouter un produit

1. Ouvrir `src/data/products.ts` et copier un objet existant de la même famille.
2. Renseigner au minimum :

```ts
{
  id: 'plateau-mchewek',            // slug URL : minuscules, tirets, sans accent
  nom: 'Plateau Mchewek',
  nomArabe: 'مشوك',                 // facultatif, accent décoratif
  categorie: 'plateaux',            // doit exister dans categories.ts
  artisan: 'lilia',                 // doit exister dans artisans.ts
  ville: 'Constantine',
  description: '…',                 // 1–2 phrases : carte produit + meta description
  descriptionLongue: '…',           // le geste, la matière, ce qui varie d’une pièce à l’autre
  prix: PRIX_PLACEHOLDER,
  image: '/products/plateau-mchewek.jpg',
  galerie: ['/products/plateau-mchewek-2.jpg'],
  vedette: true,                    // facultatif : remonte la pièce en page d’accueil
  tracabilite: { argile: '…', technique: '…', cuisson: '…', dimensions: '…', entretien: '…' },
  commerce: commerce('PLA-MCH-01'), // ('PLA-MCH-01', 'serie') si la pièce est refaite à la demande
}
```

3. `npm run check` puis `npm run dev` : la page `/produits/plateau-mchewek` et l’entrée
   dans `/collection` sont générées automatiquement.
4. Déposer la photo dans `public/products/` (ou la laisser venir plus tard).

Pour ajouter une **famille d’objets**, ajouter d’abord une entrée dans
`src/data/categories.ts` : elle apparaît dans le filtre de `/collection` et dans le pied de page.

---

## 5. Structure

```
atelier-alger/
├── public/
│   ├── favicon.svg
│   └── products/              ← toutes les photos, + artisans/
├── scripts/photos.mjs         ← inventaire des photos manquantes
└── src/
    ├── components/
    │   ├── Footer.astro
    │   ├── Header.astro       ← menu accessible (aria-expanded, Échap)
    │   ├── Logo.astro
    │   ├── ProductCard.astro
    │   └── Visuel.astro       ← photo si elle existe, sinon placeholder au même format
    ├── data/                  ← TOUT le contenu modifiable
    │   ├── artisans.ts
    │   ├── brand.ts
    │   ├── categories.ts
    │   └── products.ts
    ├── layouts/Base.astro
    ├── lib/images.ts
    ├── pages/
    │   ├── index.astro        ← page d’accueil
    │   ├── collection.astro   ← catalogue complet par famille
    │   └── produits/[slug].astro  ← une page par pièce (27 générées)
    └── styles/global.css      ← palette, typographie, composants de base
```

---

## 6. Direction artistique

| Jeton | Valeur | Usage |
| --- | --- | --- |
| `lin` | `#F5EFE6` | fond général |
| `lin-profond` | `#EDE4D7` | fonds de placeholder alternés |
| `ardoise` | `#2B2622` | texte, fond du hero |
| `argile` | `#8B4530` | accents, bouton principal |
| `teal` / `teal-profond` | `#4F7C77` / `#3C625E` | accents ; le teal foncé porte le texte blanc du bandeau CTA |
| `filet` | `#DDD2C1` | filets de 1 px |
| `mastic` | `#6B5F55` | légendes et textes secondaires |
| `blanc` | `#FFFFFF` | cartes et sections |

Typographie (Google Fonts) : **DM Serif Display** pour les titres (italique sur les grands
titres), **Jost** pour le corps, **Noto Naskh Arabic** pour les accents arabes.
Arrondis : 2–4 px (`rounded-xs`, `rounded-sm`, `rounded-md`).

**Contrastes** — toutes les paires texte/fond du site ont été vérifiées ≥ 4,9:1 (AA).
Le teal de la charte est assombri (`#3C625E`) sous le texte blanc du bandeau CTA :
le teal d’origine plafonne à 3,6:1 pour le texte secondaire, en dessous du seuil AA.

**Accessibilité** — liens et boutons natifs uniquement (aucun `onClick` sur une `div`),
cibles tactiles ≥ 44 px, `alt` sur toutes les images (les placeholders portent
`role="img"` + `aria-label`), lien d’évitement, focus visible, `prefers-reduced-motion`
respecté.

---

## 7. Phase 2 — ce qui n’est pas dans le MVP

- **Commerce.** `Product.commerce` (`sku`, `devise`, `disponibilite`, `referenceExterne`)
  est déjà là : brancher Shopify ou Stripe revient à remplir `referenceExterne` et à
  remplacer le bouton « Réserver cette pièce » de `src/pages/produits/[slug].astro`.
  Aucun changement de structure de données à prévoir.
- **i18n / arabe.** L’arabe est pour l’instant un **accent typographique** (nom de pièce,
  baseline), pas une locale. Une version RTL complète suppose `dir="rtl"`, le miroir des
  mises en page et la traduction de tout le contenu de `src/data/` — à traiter en phase 2.
  Le sélecteur de langue du pied de page est en place, options AR et EN désactivées.
- **Formulaire d’inscription.** Le champ e-mail du bandeau CTA est une maquette
  fonctionnelle (vrai `<input type="email">` + `<label>`) : il reste à le brancher sur
  l’outil d’e-mailing retenu.
- **Témoignages.** La section est volontairement vide : aucun avis n’a été inventé.
