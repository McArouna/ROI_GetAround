# Atelier Alger — site vitrine & catalogue (MVP)

Céramique algérienne peinte à la main, présentée à la diaspora maghrébine en France.
Direction : **galerie haut de gamme**, épurée, très aérée.

- Astro 7 + Tailwind CSS 4 + TypeScript, sortie 100 % statique (`dist/`)
- Pas de paiement en ligne : **réservation par e-mail**. La structure produit
  (`Product.commerce`) est prête pour Shopify / Stripe, sans refonte.
- Deux polices (DM Serif Display, Jost), palette inchangée, **aucun texte arabe**.

> **État de la refonte** : la page d'accueil est livrée pour validation. La fiche
> produit est en version d'attente (même système visuel) ; sa refonte complète — photo
> sticky + miniatures, traçabilité en accordéon, bloc artisan compact — suit la
> validation de l'accueil.

---

## 1. Lancer le projet

```bash
cd atelier-alger
npm install
npm run dev        # http://localhost:4321
```

| Commande | Effet |
| --- | --- |
| `npm run dev` / `build` / `preview` | développement, build statique, prévisualisation |
| `npm run check` | vérification TypeScript / Astro (0 erreur attendue) |
| `npm run detourer` | étape 1 des images : détourage des photos brutes |
| `npm run images` | étape 2 : normalisation et export WebP / PNG / JPEG, 1× et 2× |
| `npm run photos` | inventaire des visuels livrés, à traiter ou manquants |

**Déploiement** — tout est réglé dans `netlify.toml`, à la racine du dépôt : dossier de
base `atelier-alger`, commande `npm run build`, publication de `dist`, Node 22 (Astro 7
exige Node ≥ 22.12). Sur Netlify : *Add new site → Import an existing project → GitHub*,
choisir le dépôt et la branche, puis *Deploy* — aucun réglage à saisir à la main.
Sur Vercel : Root Directory `atelier-alger`, Node 22.

---

## 2. La page d'accueil

Dans l'ordre :

1. **Barre d'annonce** fine, défilante (« Peint à la main, pièce par pièce » / « Expédié
   depuis l'Algérie vers la France »). Pause au survol, immobile si l'utilisateur limite les
   animations. Messages : `src/data/brand.ts` → `annonces`.
2. **Header** : logo centré ; à gauche *Collections* (par région) et *Pièces* (par type),
   sous-menus au survol **et** au clavier ; à droite *L'atelier* et *Contact*. Hamburger
   en mobile uniquement.
3. **Hero** : la nature morte **en entier**, en fond, sur toute la largeur. Le texte se pose
   sur le mur vert à droite de la scène ; sur mobile, il passe sous l'image. Un seul bouton.
4. **Pièce à la une** : galerie à gauche (photo + deux gros plans), nom, prix, description,
   « Réserver cette pièce » à droite. Choix de la pièce : `ID_PIECE_A_LA_UNE` dans
   `src/data/products.ts`.
5. **Rangées** : un type de pièce (*Qraba & fioles*) puis une collection régionale (*Terres
   berbères*), 4 pièces en 4:5, badge « Réservé », lien « Tout afficher ». Une pièce n'est
   jamais montrée deux fois sur la page.
6. **Une phrase de réassurance** entre chaque rangée.
7. **Bloc atelier** : photo en arche, trois lignes, trois chiffres clés — tous tirés des
   données (nombre d'artisans, de régions ; « 100 % peint à la main » est la promesse de
   marque). Aucun chiffre inventé.
8. **Lettre** « Réassorts et nouveautés ».
9. **Footer** minimal : Livraison, Retours, CGV, Mentions légales, *Devenir artisan
   partenaire*.

Supprimés : témoignages, miniatures du hero, blocs de garanties 01-04.

### Navigation du catalogue

Inspirée des galeries d'artisanat : deux portes d'entrée croisées.

- **Collections par région** — `src/data/collections.ts` : Alger & la Casbah, Terres
  berbères (Kabylie, M'zab), Tlemcen & Nedroma, Constantine. Une pièce appartient à la
  collection de son artisan (`src/data/artisans.ts` → `collection`), sauf si
  `products.ts` précise `collection`.
- **Types de pièces** — `src/data/categories.ts` : Tasses & gobelets, Qraba & fioles,
  Assiettes & plats, Pichets & services, etc.

Pages : `/collection` (tout), `/collection/<region-ou-type>`, `/produits/<id>`,
`/infos/<page>`.

### Aucune case vide

Une pièce **n'apparaît sur le site que si sa photo est livrée** (`src/lib/catalogue.ts`).
Les 33 fiches restent dans `src/data/products.ts`, textes compris ; aujourd'hui 9 sont
photographiées et visibles. Un type ou une collection sans aucune pièce photographiée
disparaît de la navigation, et revient de lui-même dès qu'une photo arrive.

---

## 3. Le système d'image

| Règle | Mise en œuvre |
| --- | --- |
| **Photos produit : 4:5, partout** | `Packshot.astro` : cartes, rangées, pièce à la une, fiche, pièces associées. |
| **Fond uni identique** | Les packshots sont détourés (fond transparent) et posés sur un fond unique, `--color-fond-produit`, dérivé de la palette (crème + filet). Le fond de la photo d'origine ne se voit jamais. |
| **Produit ~70 % du cadre** | Le pipeline ramène chaque objet à la même masse visuelle : une pièce verticale occupe 70 % de la hauteur ; une pièce large (assiette, service) est plafonnée à 86 % de la largeur. Marge cuite dans le fichier, aucun zoom CSS. |
| **Une ombre, une lumière** | Aucune ombre dans l'image ; `drop-shadow(0 14px 22px rgba(43,38,34,.18))` en CSS, la même pour toutes les pièces. |
| **Ambiances en arche** | `Photo.astro` avec `arche` : demi-cercle parfait en tête. Réservé aux photos d'ambiance (atelier, artisan, hero secondaire), **jamais** aux produits. |
| **Qualité** | `<picture>` WebP + repli PNG (packshots) ou JPEG (photos), 1× et 2×, `sizes` ; `lazy` sauf au-dessus de la ligne de flottaison. Aucune image agrandie au-delà de sa taille native. |

### Circuit d'une photo

```
sources/<id>.(jpg|png|webp)   photo brute, fond quelconque
        ↓  npm run detourer        étape 1 — Python + rembg (modèle U²-Net)
sources/detoures/<id>.png     fond transparent
        ↓  npm run images          étape 2 — Node + sharp
public/products/<id>{,@2x}.{webp,png}
```

- Les **photos d'ambiance** (`hero-nature-morte`, `atelier-ambiance`, …) et les **gros
  plans** (`<id>-detail-N`) ne sont pas détourés : transcodage seul.
- L'étape 1 demande `python3 -m pip install rembg onnxruntime pillow` (modèle d'environ
  200 Mo au premier appel). Un PNG détouré à la main déposé dans `sources/detoures/`
  fait le même office. Les PNG détourés sont versionnés : l'étape 2 suffit ensuite.
- Détourage de secours sans Python : `npm run images -- --heuristique` (approximatif).

### Visuels en place

| Visuel | Origine |
| --- | --- |
| `hero-nature-morte` | photo fournie (1983 × 793), servie en entier |
| `atelier-ambiance` | recadrage 3:4 de la nature morte, pour l'arche |
| `tasse-tanit`, `qraba-casbah`, `qraba-el-khat`, `qraba-zahra`, `fiole-vert-olive`, `fiole-safran` | photos fournies, détourées |
| `service-rayures-ghardaia` | photo de groupe fournie, détourée en entier |
| `assiette-rayee-ghardaia`, `gobelets-rayes` | recadrages de la photo de groupe, détourés |
| `qraba-casbah-detail-1`, `-detail-2` | gros plans recadrés dans la photo de la Qraba Casbah |

> Plusieurs photos fournies font moins de 1600 px : le « 2× » vaut alors la taille native.
> Avec des originaux plus grands, `npm run images` produit un vrai 2× sans toucher au code.
> Pour la suite de la série : **une seule direction de lumière**, la même pour toutes les
> prises de vue — c'est le seul point qu'aucun traitement ne rattrape.

---

## 4. Où changer quoi

| Quoi | Où |
| --- | --- |
| Nom de marque (provisoire), accroche, e-mail, téléphone | `src/data/brand.ts` |
| **Prix** (`xx €` partout aujourd'hui) | `src/data/brand.ts` → `PRIX_PLACEHOLDER`, ou pièce par pièce |
| Prénoms et ateliers des artisans (provisoires) | `src/data/artisans.ts` |
| Pièces : textes, réservation (`reservee`), mise en avant | `src/data/products.ts` |
| Collections par région / types de pièces | `src/data/collections.ts` / `src/data/categories.ts` |
| Pages Livraison, Retours, CGV, Mentions légales, Artisan partenaire | `src/data/infos.ts` |
| Textes de l'accueil, phrases de réassurance | `src/pages/index.astro` |
| Couleurs, polices, ombres, boutons, arche | `src/styles/global.css` |
| Échelle des packshots, dimensions du cadre | `scripts/preparer-images.mjs` |

Les CGV et mentions légales ne sont pas rédigées : elles dépendent de la société et sont
à fournir. Les données de traçabilité encore entre crochets (`[1 020 °C]`, `[Ø 26 cm]`…)
sont à confirmer avec les ateliers.

## 5. Ajouter une pièce

1. Copier une entrée de `src/data/products.ts` ; `image: '/products/<id>'` **sans
   extension**.
2. Déposer la photo dans `sources/<id>.jpg`, puis `npm run detourer && npm run images`.
3. `npm run check && npm run dev` : la fiche `/produits/<id>` et sa place dans les listes
   sont générées. Sans photo, la pièce reste masquée.

## 6. Accessibilité & contrastes

Liens, boutons et champs natifs ; cibles ≥ 44 px ; `alt` sur toutes les images ;
sous-menus ouverts au clavier (`:focus-within`) ; menu mobile avec `aria-expanded` et
Échap ; lien d'évitement ; animations coupées si `prefers-reduced-motion`. Textes
secondaires ≥ 5,4:1 sur le crème, texte clair ≥ 6,5:1 sur les verts.

## 7. Phase 2

- **Commerce** : remplir `commerce.referenceExterne` et remplacer le lien de réservation.
- **Lettre** : brancher le formulaire sur l'outil d'e-mailing.
- **Fiche produit** : refonte complète après validation de l'accueil.
