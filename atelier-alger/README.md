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
- **Système d’image unique** : packshots détourés, échelle normalisée, une seule ombre
  (voir § 2)

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
| `npm run detourer` | détoure les photos brutes (étape 1 du pipeline d’images) |
| `npm run images` | normalise et exporte les visuels (étape 2) |
| `npm run photos` | liste les visuels manquants ou en attente de traitement |

### Déploiement

Le dépôt contient aussi, à sa racine, un ancien outil sans rapport : **la racine du projet
à déployer est le dossier `atelier-alger/`.**

- **Vercel** — Framework : Astro · Root Directory : `atelier-alger` · Build : `npm run build` · Output : `dist`
- **Netlify** — Base directory : `atelier-alger` · Build : `npm run build` · Publish : `atelier-alger/dist`

---

## 2. Le système d’image

Toutes les images produit du site obéissent au même contrat. C’est ce qui fait tenir la
grille : aucune vignette n’est traitée au cas par cas.

| Règle | Mise en œuvre |
| --- | --- |
| **Fond transparent** | Les packshots sont des PNG/WebP détourés. Le fond visible est toujours celui de la section (crème `#F5F0E8` ou charbon `#2B2622`), jamais celui de la photo. |
| **Échelle normalisée** | Chaque objet est ramené à la **même masse visuelle** : l’aire qu’occupe une pièce verticale haute de 70 % du cadre. Une qraba atterrit donc à 70 % de la hauteur, une tasse large à ~49 % — mais les deux occupent 35 % de l’aire du cadre. La marge interne est constante, cuite dans le fichier : aucun zoom CSS. |
| **Cadres identiques** | Même `aspect-ratio: 1/1`, même `object-fit: contain`, même rayon (4 px), même ombre, partout — vignettes d’accueil, catalogue, page produit, pièces liées. |
| **Une seule lumière** | Aucune ombre n’est cuite dans l’image. L’ombre est posée en CSS avec `drop-shadow` (qui épouse le détourage, contrairement à `box-shadow`), toujours verticale : `0 12px 24px`. Seule l’opacité s’adapte au fond — `rgba(0,0,0,.45)` sur charbon, `rgba(43,38,34,.20)` sur crème. |
| **Survol** | `translateY(-4px)`, transition 200 ms. Rien d’autre. |
| **Qualité de service** | WebP avec repli PNG (packshots) ou JPEG (scènes), en 1× et 2×, via `<picture>` + `srcset`. `loading="lazy"` partout sauf au-dessus de la ligne de flottaison (hero). |
| **Pas de recadrage destructif** | Toute la série est exportée aux mêmes dimensions : cadre de 800 × 800 px en 2×, 400 × 400 px en 1×. |

Deux composants, et deux seulement :

- `src/components/Packshot.astro` — les produits. Cadre carré, détourage, ombre CSS.
- `src/components/Photo.astro` — les photos d’ambiance (nature morte du hero, scènes
  d’atelier, portraits d’artisans). Cadrage photographique (`cover`), sans ombre ajoutée :
  l’ombre appartient à la scène.

### Cohérence hero ↔ vignettes

Un seul univers, deux fonds. La nature morte du hero n’est pas posée en rectangle sur la
page : elle est **fondue dans le fond de la section** par un voile de dégradé
(`.hero-voile`) qui la raccorde au charbon à gauche et en bas sur grand écran, en haut et
en bas sur mobile — aucune arête de photo n’est visible. Les vignettes du hero sont les
mêmes packshots détourés que ceux du catalogue, posés directement sur ce charbon avec
l’ombre de contact. Et le vert de la bande « accès anticipé » (`#023833`) est échantillonné
dans la photo elle-même : les deux bandes sombres du site partagent la couleur du décor
photographié.

---

## 3. Ajouter ou remplacer une photo

### Le circuit

```
sources/<id>.jpg              photo brute, fond quelconque
        ↓   npm run detourer          (étape 1 — Python + rembg)
sources/detoures/<id>.png     détourage, fond transparent
        ↓   npm run images            (étape 2 — Node + sharp)
public/products/<id>.webp     WebP 1× + 2×, PNG de repli, échelle normalisée
```

1. Déposer la photo brute dans **`sources/`**, nommée comme l’identifiant du produit
   (`sources/tasse-tanit.jpg`). Fond uni clair de préférence, mais peu importe : il est
   retiré.
2. `npm run detourer` — détoure ce qui ne l’est pas encore. `-- --force` pour refaire,
   `-- tasse-tanit` pour une seule pièce.
3. `npm run images` — normalise l’échelle et exporte tous les formats.
4. `npm run build` — la pièce apparaît avec sa photo.

### Les deux étapes, séparément

L’**étape 1** demande Python et le paquet `rembg` (modèle U²-Net, ~200 Mo téléchargés au
premier appel) :

```bash
python3 -m pip install rembg onnxruntime pillow
```

Pourquoi un modèle, et pas un simple seuillage : un émail blanc sur fond crème ne se
distingue pas par la couleur — la paroi d’une tasse blanche est souvent *plus claire* que
le fond, et son ombre propre est aussi neutre qu’une ombre portée. Un détourage de secours
sans Python existe (`npm run images -- --heuristique`, basé sur les contours), mais il
laisse des approximations : à réserver au dépannage.

Rien n’oblige à passer par rembg : **tout PNG détouré à la main** (Photoshop, Photopea,
remove.bg, un retoucheur) déposé dans `sources/detoures/<id>.png` fait l’affaire. Les PNG
détourés sont versionnés dans le dépôt : l’**étape 2** suffit ensuite, sans Python.

### Ce qu’on attend du photographe

| | |
| --- | --- |
| Cadrage | objet entier, centré, avec de l’air autour — le recadrage est automatique |
| Fond | uni, clair, sans dégradé marqué ; une ombre portée douce est acceptée (elle est retirée) |
| Lumière | **une seule direction, la même pour toute la série** : source haute, légèrement de face. C’est le seul point qu’aucun traitement ne rattrape. |
| Résolution | 1600 px minimum sur le grand côté (voir la réserve ci-dessous) |
| Format | JPEG ou PNG, sans profil exotique |
| Scènes | pour les photos d’ambiance (`hero-nature-morte`, `atelier-*`, `sortie-de-four`), pas de détourage : cadrage soigné, ratio portrait pour le hero |

> **Réserve sur le 2×.** Les cinq photos fournies font 744 à 941 px de large. Le pipeline
> n’agrandit jamais une image : le « 2× » exporté vaut donc la taille native, et le 1× sa
> moitié. C’est suffisant pour la maquette, juste sur grand écran. Avec des originaux
> ≥ 1600 px, `npm run images` produit un vrai 2× sans rien changer au code.

### Noms de fichiers attendus

Les données (`src/data/`) référencent un chemin **sans extension** — par exemple
`/products/tasse-tanit` — et le pipeline fabrique `tasse-tanit.webp`,
`tasse-tanit@2x.webp`, `tasse-tanit.png`, `tasse-tanit@2x.png`.
Règle de nommage : `<identifiant-du-produit>` pour le visuel principal, puis `-2`, `-3`
pour les vues de galerie.

| Pièce | Visuels (base, sans extension) |
| --- | --- |
| Tasse Tanit | **`tasse-tanit`** ✓, `tasse-tanit-2`, `tasse-tanit-3` |
| Mug Sabah el-Kheir | `mug-sabah-el-kheir`, `mug-sabah-el-kheir-2` |
| Tasse Khamsa | `tasse-khamsa`, `tasse-khamsa-2` |
| Bol Ocre du Hoggar | `bol-ocre-du-hoggar`, `bol-ocre-du-hoggar-2`, `bol-ocre-du-hoggar-3` |
| Coffret de bols Tassili | `coffret-bols-tassili`, `coffret-bols-tassili-2`, `coffret-bols-tassili-3` |
| Bol Pêche & Signes | `bol-peche-et-signes`, `bol-peche-et-signes-2` |
| Tajine Fleurs de Nedroma | `tajine-fleurs-de-nedroma`, `tajine-fleurs-de-nedroma-2`, `tajine-fleurs-de-nedroma-3` |
| Tajine Dhahab | `tajine-dhahab`, `tajine-dhahab-2` |
| Assiette Étoile de Béjaïa | `assiette-etoile-de-bejaia`, `assiette-etoile-de-bejaia-2` |
| Plat Bord Safran | `plat-bord-safran`, `plat-bord-safran-2` |
| Plateau Baklawa | `plateau-baklawa`, `plateau-baklawa-2`, `plateau-baklawa-3` |
| Plateau Makrout & Griwech | `plateau-makrout-griwech`, `plateau-makrout-griwech-2` |
| Plateau Bourek du vendredi | `plateau-bourek-du-vendredi`, `plateau-bourek-du-vendredi-2` |
| Qraba Casbah | **`qraba-casbah`** ✓, `qraba-casbah-2`, `qraba-casbah-3` |
| Qraba El Khat | **`qraba-el-khat`** ✓, `qraba-el-khat-2`, `qraba-el-khat-3` |
| Qraba Zahra | **`qraba-zahra`** ✓, `qraba-zahra-2` |
| Gourde Haïk | `gourde-haik`, `gourde-haik-2` |
| Qraba émaillée Bleu d’Alger | `qraba-emaillee-bleu-alger`, `qraba-emaillee-bleu-alger-2` |
| Pichet Rayures de Ghardaïa | `pichet-rayures-de-ghardaia`, `pichet-rayures-de-ghardaia-2` |
| Carafe Ligne Blanche | `carafe-ligne-blanche`, `carafe-ligne-blanche-2` |
| Carreau Zellige Étoile | `carreau-zellige-etoile`, `carreau-zellige-etoile-2` |
| Planche Zellige | `planche-zellige`, `planche-zellige-2` |
| Main de Fatma murale | `main-de-fatma-murale`, `main-de-fatma-murale-2` |
| Repose-cuillère Khamsa | `repose-cuillere-khamsa`, `repose-cuillere-khamsa-2` |
| Savon Fleur d’oranger | `savon-fleur-oranger`, `savon-fleur-oranger-2` |
| Savon Figue de Barbarie | `savon-figue-de-barbarie`, `savon-figue-de-barbarie-2` |
| Def peint | `def-peint`, `def-peint-2` |
| Cadre Portes de la Casbah | `cadre-portes-de-la-casbah`, `cadre-portes-de-la-casbah-2` |
| Affiche Alger la Blanche | `affiche-alger-la-blanche`, `affiche-alger-la-blanche-2` |
Les visuels **en gras suivis de ✓** sont déjà livrés et traités.

Scènes : `hero-nature-morte` ✓, `atelier-mains`, `atelier-sechage`, `sortie-de-four`.
Portraits : `artisans/yasmine`, `artisans/karim`, `artisans/nawel`, `artisans/sofiane`,
`artisans/lilia`, `artisans/mehdi`, `artisans/amina`.

```bash
npm run photos          # ce qui manque ou attend un traitement
npm run photos -- --all # l'inventaire complet
```

Tant qu’un visuel manque, le site affiche un **repère au format exact** de la photo à
venir, dans le même cadre que les autres : la grille ne bouge pas d’un pixel quand la
photo arrive. La page d’accueil met automatiquement en avant les pièces déjà
photographiées (`photosDabord()` dans `src/lib/images.ts`).

> Ne jamais copier de photo Instagram ou de tiers : toutes les images doivent être
> produites par la marque ou cédées par écrit.

---

## 4. Où changer quoi

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
| **Couleurs, polices, arrondis, ombres produit** | `src/styles/global.css` (bloc `@theme`) |
| Échelle des packshots, taille des cadres | `scripts/preparer-images.mjs` (constantes en tête) |

Tout ce qui est écrit **entre crochets** est un placeholder à remplacer avant la mise en
ligne : `[PRIX]`, `[Yasmine]`, `[+33 6 00 00 00 00]`, `[1 020 °C]`, `[Ø 32 cm]`…
Pour les repérer : `grep -rn "\[" src/data/`.

---

## 5. Ajouter un produit

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
  descriptionLongue: '…',           // le geste, la matière, ce qui varie d'une pièce à l'autre
  prix: PRIX_PLACEHOLDER,
  image: '/products/plateau-mchewek',          // SANS extension
  galerie: ['/products/plateau-mchewek-2'],
  vedette: true,                    // facultatif : remonte la pièce en page d'accueil
  tracabilite: { argile: '…', technique: '…', cuisson: '…', dimensions: '…', entretien: '…' },
  commerce: commerce('PLA-MCH-01'), // ('PLA-MCH-01', 'serie') si la pièce est refaite à la demande
}
```

3. `npm run check` puis `npm run dev` : la page `/produits/plateau-mchewek` et l’entrée
   dans `/collection` sont générées automatiquement.
4. Déposer la photo dans `sources/` et lancer le pipeline (§ 3), ou la laisser venir plus
   tard.

Pour ajouter une **famille d’objets**, ajouter d’abord une entrée dans
`src/data/categories.ts` : elle apparaît dans le filtre de `/collection` et dans le pied de
page.

---

## 6. Structure

```
atelier-alger/
├── sources/                   ← photos brutes (versionnées, hors du site publié)
│   └── detoures/              ← PNG détourés, entrée de l'étape 2
├── public/
│   ├── favicon.svg
│   └── products/              ← visuels générés : WebP + replis, 1× et 2×
├── scripts/
│   ├── detourer.py            ← étape 1 : détourage (U²-Net)
│   ├── preparer-images.mjs    ← étape 2 : normalisation d'échelle et export
│   └── photos.mjs             ← inventaire des visuels
└── src/
    ├── components/
    │   ├── Footer.astro
    │   ├── Header.astro       ← menu accessible (aria-expanded, Échap)
    │   ├── Logo.astro
    │   ├── Packshot.astro     ← LE cadre produit : carré, détouré, ombre unique
    │   ├── Photo.astro        ← photos d'ambiance et portraits
    │   └── ProductCard.astro
    ├── data/                  ← TOUT le contenu modifiable
    │   ├── artisans.ts
    │   ├── brand.ts
    │   ├── categories.ts
    │   └── products.ts
    ├── layouts/Base.astro
    ├── lib/images.ts          ← jeux WebP/repli + tri « photos d'abord »
    ├── pages/
    │   ├── index.astro        ← page d'accueil
    │   ├── collection.astro   ← catalogue complet par famille
    │   └── produits/[slug].astro  ← une page par pièce (29 générées)
    └── styles/global.css      ← palette, typographie, système packshot
```

---

## 7. Direction artistique

| Jeton | Valeur | Usage |
| --- | --- | --- |
| `lin` | `#F5F0E8` | le crème des sections produit, fond dominant |
| `ardoise` | `#2B2622` | texte, et fond charbon du hero |
| `argile` | `#8B4530` | accents, bouton principal sur fond clair |
| `argile-clair` | `#A9583F` | bouton principal sur fond sombre (contraste de bordure) |
| `teal` / `teal-profond` | `#4F7C77` / `#3C625E` | accents, nom de l’artisan |
| `vert-atelier` | `#023833` | bandes sombres — couleur échantillonnée dans la nature morte |
| `filet` | `#DDD2C1` | filets de 1 px, repères d’attente |
| `mastic` | `#6B5F55` | légendes et textes secondaires |
| `blanc` | `#FFFFFF` | tableau de traçabilité, champs de formulaire |

Typographie (Google Fonts) : **DM Serif Display** pour les titres (italique sur les grands
titres), **Jost** pour le corps, **Noto Naskh Arabic** pour les accents arabes.
Arrondis : 2–4 px (`rounded-xs`, `rounded-sm`, `rounded-md`).

**Contrastes** — toutes les paires texte/fond du site ont été vérifiées ≥ 5,4:1 (AA).
Deux arbitrages, documentés dans `global.css` :
le teal de la charte est assombri (`#3C625E`) pour le texte fin, et le bouton primaire
passe à l’argile clair sur fond sombre (l’argile de la charte ne donne que 2,1:1 pour la
bordure du composant, sous le seuil 3:1 de la règle 1.4.11).

**Accessibilité** — liens et boutons natifs uniquement (aucun `onClick` sur une `div`),
cibles tactiles ≥ 44 px, `alt` sur toutes les images (les repères d’attente portent
`role="img"` + `aria-label`), lien d’évitement, focus visible, `prefers-reduced-motion`
respecté.

---

## 8. Phase 2 — ce qui n’est pas dans le MVP

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
