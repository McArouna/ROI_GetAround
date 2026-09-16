# Tarificateur PowerBody — prix d'achat € → prix de vente en dinars

Deux morceaux, utilisables séparément :

| Fichier | Rôle |
|---|---|
| `extraire.py` | se connecte à votre compte PowerBody, parcourt une page de marque et sort les produits avec leur prix d'achat (CSV + JSON) |
| `tarificateur.html` | page à ouvrir dans le navigateur : vous bougez le taux et la marge, elle recalcule tous les prix de vente en direct |

Le taux par défaut est celui du marché parallèle : **1 € = 280 DA** (modifiable partout).

---

## 1. Installation (une seule fois)

```bash
cd powerbody
pip install -r requirements.txt
playwright install chromium
```

Puis vos identifiants, qui restent sur votre machine :

```bash
cp .env.exemple .env      # Windows : copy .env.exemple .env
```
et remplissez `POWERBODY_EMAIL` / `POWERBODY_MOTDEPASSE` dans `.env`.

> `.env`, `session.json` et le dossier `export/` sont ignorés par git : ni mot de passe
> ni prix d'achat ne partent sur GitHub.

## 2. Extraction

```bash
python3 extraire.py
```

Par défaut : la marque NOW Foods (`https://fr.powerbody.eu/marque-now-foods,9.html`),
toutes les pages, marge de 500 DA. Résultat dans `export/` :
`produits.csv` (ouvrable dans Excel), `produits.json` et `donnees.js` (lu par la page HTML).

Options utiles :

```bash
python3 extraire.py --marge 800 --arrondi 100        # marge 800 DA, prix arrondis au 100 DA supérieur
python3 extraire.py --mode pct --marge 35            # marge de 35 % au lieu d'un montant fixe
python3 extraire.py --taux 265                       # autre taux de change
python3 extraire.py --frais 300                      # 300 DA de frais (transport, douane…) par produit
python3 extraire.py --url "https://fr.powerbody.eu/marque-optimum-nutrition,12.html"
python3 extraire.py --url ... --url ...              # plusieurs marques d'un coup
python3 extraire.py --login-manuel                   # ouvre le navigateur, vous vous connectez à la main
python3 extraire.py --headful                        # voir ce que fait le robot
```

La session est enregistrée dans `session.json` : les fois suivantes, pas de reconnexion.

## 3. La page de tarification

Ouvrez `tarificateur.html` (double-clic). Elle charge toute seule `export/donnees.js`.
Si rien n'apparaît, glissez `export/produits.json` sur la page.

Ce que vous pouvez régler :

- **taux EUR → DA** (curseur, 280 par défaut) ;
- **marge voulue** : en dinars par produit, en pourcentage, ou en euros ;
- **frais par produit** en DA (transport, douane, emballage) ;
- **arrondi** du prix de vente (au 50 DA supérieur, au 100…) ;
- **prix de vente forcé** : tapez directement dans la colonne « Vente DA » pour un produit,
  la marge réelle se recalcule (bouton « Réinitialiser » pour tout remettre d'aplomb) ;
- **colonne quantité** : cochez-la pour simuler une commande et voir la marge totale ;
- export CSV du tableau affiché.

Vos réglages sont mémorisés dans le navigateur.

### Le calcul

```
achat DA   = prix € × taux
revient DA = achat DA + frais
vente DA   = arrondi_supérieur(revient + marge)      (ou revient × (1 + marge%))
marge DA   = vente − revient
marge %    = marge DA / revient
```

Les mêmes formules sont dans `tarifs.py` et dans la page HTML — elles sont vérifiées par les tests.

## 4. Si l'extraction ne trouve rien

Le site peut changer son gabarit HTML. Dans l'ordre :

```bash
python3 extraire.py --headful --dump      # voir la page + garder le HTML dans export/html/
python3 extraire.py --strategie heuristique
```

Solution de secours **sans robot** : ouvrez la page dans votre navigateur (connecté),
`Ctrl+S` pour l'enregistrer, puis

```bash
python3 extraire.py --fichiers "ma_page.html"
```

Le HTML gardé par `--dump` permet aussi de corriger les sélecteurs dans `parsing.py`
(listes `SEL_BLOCS`, `SEL_NOM`, `SEL_PRIX_FINAL`).

## 5. Tests

```bash
python3 test_parsing.py
```

Vérifie la lecture des prix (`24,90 €`, `€24.90`, `1 234,56 €`), trois gabarits de page
différents, la détection des promos et des ruptures, et les calculs de marge.

## Remarques

- **Les prix affichés dépendent du compte connecté.** L'extracteur prévient
  (`! attention : prix publics`) s'il n'a pas réussi à ouvrir la session : dans ce cas les
  prix relevés ne sont pas vos prix d'achat.
- Une pause de 1,5 s sépare deux pages (`--delai`) pour ne pas matraquer le site.
- Les prix PowerBody sont TTC européens ; à l'export hors UE la TVA peut être déduite au
  panier. Le cas échéant, mettez ce rabais en `--frais` négatif ou recalez le taux.
